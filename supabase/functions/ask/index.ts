// "Ask AI": questions answered by Claude from the person's kundli and numbers.
//
//   GET  /ask?profileId=<uuid>     -> { wallet, thread }   the latest conversation about that person
//   GET  /ask                      -> { wallet, thread }   the latest general conversation
//   POST /ask  { question, language, profileId?, threadId? }
//        -> { threadId, answer, distress, wallet }
//        -> 402 { error, wallet } when no free questions or credits are left
//
// Premium members ask without counting (fair-use daily limit); others use a free question, otherwise one credit.
// If the AI cannot answer, the question is given back.
// Questions and answers are stored encrypted, like birth details.
import { cleanQuestion } from '../_shared/ask.ts';
import { answer, latestThread, resolveConversation } from '../_shared/chat.ts';
import { chatErrorResponse } from '../_shared/chat-errors.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { isLanguage } from '../_shared/languages.ts';
import { UUID } from '../_shared/profiles.ts';
import { admin, getUser } from '../_shared/supabase.ts';
import { freeLimit, getWallet, premiumDaily } from '../_shared/wallet.ts';

const WASM = new URL('./swiss_eph.wasm', import.meta.url);

async function handlePost(userId: string, req: Request) {
  const body = ((await readJson(req)) ?? {}) as Record<string, unknown>;
  const question = cleanQuestion(body.question);
  if (!question) return errorResponse(400, 'Please write a question (up to 1000 letters)');
  if (!isLanguage(body.language)) return errorResponse(400, 'unknown language');
  const { threadId, profile } = await resolveConversation(userId, body, null);

  // Pay for the question first (atomic in the database), give it back if anything fails.
  const db = admin();
  const { data: paidWith, error } = await db.rpc('spend_question', {
    p_user: userId,
    p_free_limit: await freeLimit(),
    p_premium_daily: await premiumDaily(),
  });
  if (error) throw error;
  if (paidWith === 'none') return json({ error: 'No questions left', wallet: await getWallet(userId) }, 402);
  try {
    const result = await answer({ ownerId: userId, question, language: body.language, threadId, profile, persona: null, wasm: WASM, paidWith });
    return json({ ...result, wallet: await getWallet(userId) });
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
    if (req.method === 'GET') {
      const profileId = new URL(req.url).searchParams.get('profileId');
      if (profileId && !UUID.test(profileId)) return errorResponse(400, 'Invalid profileId');
      return json({ wallet: await getWallet(user.id), thread: await latestThread(user.id, profileId, null) });
    }
    if (req.method === 'POST') return await handlePost(user.id, req);
    return errorResponse(405, 'Method not allowed');
  } catch (err) {
    return chatErrorResponse(err, 'ask');
  }
});
