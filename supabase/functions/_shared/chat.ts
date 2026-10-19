// Conversations with the AI ("Ask AI" and the personas): reading, answering and storing (encrypted).
// Paying for messages is done by the calling function; this file only talks and stores.
import { askSystem, chartSummary, cleanAnswer, HISTORY_MESSAGES, ASK_SCHEMA } from './ask.ts';
import { type ChatTurn, generateJson, modelFor } from './claude.ts';
import { decryptJson, encryptJson } from './crypto.ts';
import { ephemeris } from './engine.ts';
import { buildKundli } from './kundli/index.ts';
import { LANGUAGE_NAMES } from './languages.ts';
import { type Persona, personaInstructions } from './personas.ts';
import { keyRing, loadProfile, type PublicProfile, UUID } from './profiles.ts';
import { admin } from './supabase.ts';

/** Messages shown when a conversation is opened. */
export const SHOWN_MESSAGES = 60;

type Stored = { text: string; distress?: boolean };
type MessageRow = { id: string; role: 'user' | 'assistant'; content_enc: string; created_at: string };

export async function readMessages(ownerId: string, threadId: string, limit: number) {
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

/** The latest conversation of this user about a person (or general), with a persona (or Ask AI). */
export async function latestThread(ownerId: string, profileId: string | null, personaId: string | null) {
  let query = admin().from('chat_threads').select('id, birth_profile_id').eq('owner_id', ownerId);
  query = profileId ? query.eq('birth_profile_id', profileId) : query.is('birth_profile_id', null);
  query = personaId ? query.eq('persona_id', personaId) : query.is('persona_id', null);
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id as string, profileId: data.birth_profile_id as string | null, messages: await readMessages(ownerId, data.id, SHOWN_MESSAGES) };
}

export class ChatInputError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Works out which conversation and person a new message belongs to (checking they are this user's). */
export async function resolveConversation(
  ownerId: string,
  body: Record<string, unknown>,
  personaId: string | null,
): Promise<{ threadId: string | null; profile: PublicProfile | null }> {
  const db = admin();
  let threadId: string | null = null;
  let profileId: string | null = null;
  if (typeof body.threadId === 'string') {
    if (!UUID.test(body.threadId)) throw new ChatInputError('Invalid threadId', 400);
    let query = db.from('chat_threads').select('id, birth_profile_id').eq('id', body.threadId).eq('owner_id', ownerId);
    query = personaId ? query.eq('persona_id', personaId) : query.is('persona_id', null);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) throw new ChatInputError('Conversation not found', 404);
    threadId = data.id;
    profileId = data.birth_profile_id;
  } else if (typeof body.profileId === 'string') {
    if (!UUID.test(body.profileId)) throw new ChatInputError('Invalid profileId', 400);
    profileId = body.profileId;
  }
  const profile = profileId ? await loadProfile(db, ownerId, profileId) : null;
  if (profileId && !profile) throw new ChatInputError('Profile not found', 404);
  return { threadId, profile };
}

/** Asks the AI, stores the question and answer (encrypted) and returns the answer. */
export async function answer(opts: {
  ownerId: string;
  question: string;
  language: string;
  threadId: string | null;
  profile: PublicProfile | null;
  persona: Persona | null;
  wasm: URL;
  paidWith?: 'free' | 'credit';
}): Promise<{ threadId: string; answer: string; distress: boolean }> {
  const { ownerId, profile, persona } = opts;
  const db = admin();
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
          await ephemeris(opts.wasm),
        ),
      )
    : null;
  const history: ChatTurn[] = opts.threadId
    ? (await readMessages(ownerId, opts.threadId, HISTORY_MESSAGES)).map((m) => ({ role: m.role, content: m.text }))
    : [];
  // The conversation must start with a question.
  while (history.length && history[0].role !== 'user') history.shift();

  const result = await generateJson({
    model: await modelFor('chat'),
    system: askSystem(LANGUAGE_NAMES[opts.language], chart, persona ? personaInstructions(persona) : undefined),
    prompt: [...history, { role: 'user', content: opts.question }],
    schema: ASK_SCHEMA,
    maxTokens: 6000,
  });
  const reply = cleanAnswer(result.data);
  if (!reply) throw new Error('The AI answer was empty');

  let threadId = opts.threadId;
  if (!threadId) {
    const { data, error } = await db
      .from('chat_threads')
      .insert({ owner_id: ownerId, birth_profile_id: profile?.id ?? null, persona_id: persona?.id ?? null })
      .select('id')
      .single();
    if (error) throw error;
    threadId = data.id as string;
  }
  const ring = await keyRing();
  const now = Date.now();
  const { error } = await db.from('chat_messages').insert([
    {
      thread_id: threadId,
      owner_id: ownerId,
      role: 'user',
      content_enc: await encryptJson(ring, { text: opts.question }, ownerId),
      paid_with: opts.paidWith ?? 'credit',
      created_at: new Date(now).toISOString(),
    },
    {
      thread_id: threadId,
      owner_id: ownerId,
      role: 'assistant',
      content_enc: await encryptJson(ring, { text: reply.answer, distress: reply.distress }, ownerId),
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      created_at: new Date(now + 1).toISOString(),
    },
  ]);
  if (error) throw error;
  await db.from('chat_threads').update({ updated_at: new Date(now).toISOString() }).eq('id', threadId);
  console.log('chat answered', { persona: persona?.id ?? null, model: result.model, in: result.inputTokens, out: result.outputTokens });
  return { threadId, answer: reply.answer, distress: reply.distress };
}
