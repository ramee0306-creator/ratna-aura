// "Ask AI": questions answered by Claude from the person's kundli and numbers.
//
//   GET  /ask?profileId=<uuid>     -> { wallet, thread }   the latest conversation about that person
//   GET  /ask                      -> { wallet, thread }   the latest general conversation
//   POST /ask  { question, language, profileId?, threadId? }
//        -> { threadId, answer, distress, wallet }
//        -> 402 { error, wallet } when no free questions or credits are left
//
// Each question uses one of the free questions, otherwise one credit; if the AI cannot answer, it is given back.
// Questions and answers are stored encrypted, like birth details.
import Anthropic from 'npm:@anthropic-ai/sdk@0.131.0';

import { ASK_SCHEMA, askSystem, chartSummary, cleanAnswer, cleanQuestion, HISTORY_MESSAGES } from '../_shared/ask.ts';
import { AiNotConfigured, AiRefused, type ChatTurn, generateJson, modelFor } from '../_shared/claude.ts';
import { decryptJson, encryptJson } from '../_shared/crypto.ts';
import { ephemeris } from '../_shared/engine.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { buildKundli } from '../_shared/kundli/index.ts';
import { isLanguage, LANGUAGE_NAMES } from '../_shared/languages.ts';
import { keyRing, loadProfile, UUID } from '../_shared/profiles.ts';
import { admin, getUser } from '../_shared/supabase.ts';
import { freeLimit, getWallet } from '../_shared/wallet.ts';

const WASM = new URL('./swiss_eph.wasm', import.meta.url);
/** Messages shown when a conversation is opened. */
const SHOWN_MESSAGES = 60;

type Stored = { text: string; distress?: boolean };
type MessageRow = { id: string; role: 'user' | 'assistant'; content_enc: string; created_at: string };

async function readMessages(ownerId: string, threadId: string, limit: number) {
  const { data, error } = await admin()
    .from('chat_messages')
    .select('id, role, content_enc, created_at')
    .eq('thread_id', threadId)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const ring = await keyRing();
  const rows = (data as MessageRow[]).reverse();
  return Promise.all(
    rows.map(async (m) => {
      const content = await decryptJson<Stored>(ring, m.content_enc, ownerId);
      return { id: m.id, role: m.role, text: content.text, distress: content.distress === true, createdAt: m.created_at };
    }),
  );
}

async function latestThread(ownerId: string, profileId: string | null) {
  let query = admin().from('chat_threads').select('id, birth_profile_id').eq('owner_id', ownerId);
  query = profileId ? query.eq('birth_profile_id', profileId) : query.is('birth_profile_id', null);
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as { id: string; birth_profile_id: string | null } | null;
}

async function handleGet(userId: string, url: URL) {
  const profileId = url.searchParams.get('profileId');
  if (profileId && !UUID.test(profileId)) return errorResponse(400, 'Invalid profileId');
  const thread = await latestThread(userId, profileId);
  return json({
    wallet: await getWallet(userId),
    thread: thread ? { id: thread.id, profileId: thread.birth_profile_id, messages: await readMessages(userId, thread.id, SHOWN_MESSAGES) } : null,
  });
}

async function handlePost(userId: string, req: Request) {
  const body = ((await readJson(req)) ?? {}) as Record<string, unknown>;
  const question = cleanQuestion(body.question);
  if (!question) return errorResponse(400, 'Please write a question (up to 1000 letters)');
  if (!isLanguage(body.language)) return errorResponse(400, 'unknown language');
  const language = body.language;
  const db = admin();

  // Which conversation: an existing one of this user, or a new one about the chosen person.
  let threadId: string | null = null;
  let profileId: string | null = null;
  if (typeof body.threadId === 'string') {
    if (!UUID.test(body.threadId)) return errorResponse(400, 'Invalid threadId');
    const { data, error } = await db.from('chat_threads').select('id, birth_profile_id').eq('id', body.threadId).eq('owner_id', userId).maybeSingle();
    if (error) throw error;
    if (!data) return errorResponse(404, 'Conversation not found');
    threadId = data.id;
    profileId = data.birth_profile_id;
  } else if (typeof body.profileId === 'string') {
    if (!UUID.test(body.profileId)) return errorResponse(400, 'Invalid profileId');
    profileId = body.profileId;
  }

  const profile = profileId ? await loadProfile(db, userId, profileId) : null;
  if (profileId && !profile) return errorResponse(404, 'Profile not found');

  // Pay for the question first (atomic in the database), give it back if anything fails.
  const { data: paidWith, error: spendError } = await db.rpc('spend_question', { p_user: userId, p_free_limit: await freeLimit() });
  if (spendError) throw spendError;
  if (paidWith === 'none') return json({ error: 'No questions left', wallet: await getWallet(userId) }, 402);

  try {
    const chart = profile
      ? chartSummary(
          profile,
          buildKundli(
            {
              birthDate: profile.birthDate,
              birthTime: profile.birthTime,
              latitude: profile.birthPlace.latitude,
              longitude: profile.birthPlace.longitude,
              timezone: profile.birthPlace.timezone,
            },
            await ephemeris(WASM),
          ),
        )
      : null;
    const history: ChatTurn[] = threadId
      ? (await readMessages(userId, threadId, HISTORY_MESSAGES)).map((m) => ({ role: m.role, content: m.text }))
      : [];
    // The conversation must start with a question.
    while (history.length && history[0].role !== 'user') history.shift();

    const model = await modelFor('chat');
    const result = await generateJson({
      model,
      system: askSystem(LANGUAGE_NAMES[language], chart),
      prompt: [...history, { role: 'user', content: question }],
      schema: ASK_SCHEMA,
      maxTokens: 6000,
    });
    const answer = cleanAnswer(result.data);
    if (!answer) throw new Error('The AI answer was empty');

    if (!threadId) {
      const { data, error } = await db.from('chat_threads').insert({ owner_id: userId, birth_profile_id: profileId }).select('id').single();
      if (error) throw error;
      threadId = data.id as string;
    }
    const ring = await keyRing();
    const now = Date.now();
    const { error: insertError } = await db.from('chat_messages').insert([
      { thread_id: threadId, owner_id: userId, role: 'user', content_enc: await encryptJson(ring, { text: question }, userId), paid_with: paidWith, created_at: new Date(now).toISOString() },
      {
        thread_id: threadId,
        owner_id: userId,
        role: 'assistant',
        content_enc: await encryptJson(ring, { text: answer.answer, distress: answer.distress }, userId),
        model: result.model,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        created_at: new Date(now + 1).toISOString(),
      },
    ]);
    if (insertError) throw insertError;
    await db.from('chat_threads').update({ updated_at: new Date(now).toISOString() }).eq('id', threadId);
    console.log('ask answered', { model: result.model, in: result.inputTokens, out: result.outputTokens, paidWith });

    return json({ threadId, answer: answer.answer, distress: answer.distress, wallet: await getWallet(userId) });
  } catch (err) {
    await db.rpc('refund_question', { p_user: userId, p_paid_with: paidWith });
    throw err;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');

  try {
    if (req.method === 'GET') return await handleGet(user.id, new URL(req.url));
    if (req.method === 'POST') return await handlePost(user.id, req);
    return errorResponse(405, 'Method not allowed');
  } catch (err) {
    if (err instanceof AiNotConfigured) return errorResponse(503, 'Ask AI is not switched on yet');
    if (err instanceof AiRefused) return errorResponse(422, 'The AI could not answer this question. Your question was not charged.');
    if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
      return errorResponse(503, 'The AI is busy. Please try again in a minute. Your question was not charged.');
    }
    console.error('ask failed', err instanceof Error ? err.message : err);
    return errorResponse(500, 'Something went wrong. Please try again. Your question was not charged.');
  }
});
