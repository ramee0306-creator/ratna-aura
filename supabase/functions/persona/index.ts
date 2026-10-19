// Chatting with an AI persona (an AI astrologer or numerologist with its own specialty and style).
//
//   GET  /persona?personaId=meera&profileId=<uuid>  -> { wallet, session, thread }
//   POST /persona { personaId, action: "start", minutes }          -> { session, wallet }   (per-minute personas)
//   POST /persona { personaId, message, language, profileId?, threadId? }
//        -> { threadId, answer, distress, wallet, session }
//        -> 402 { error, wallet }            not enough credits (per-message personas)
//        -> 409 { error, needSession: true } no running session (per-minute personas)
//
// Personas never use the free questions of "Ask AI". If the AI cannot answer, the credit (or session message) is given back.
import { cleanQuestion } from '../_shared/ask.ts';
import { answer, latestThread, resolveConversation } from '../_shared/chat.ts';
import { chatErrorResponse } from '../_shared/chat-errors.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { isLanguage } from '../_shared/languages.ts';
import { MESSAGES_PER_MINUTE, type Persona, personaById, SESSION_MINUTES } from '../_shared/personas.ts';
import { UUID } from '../_shared/profiles.ts';
import { admin, getUser } from '../_shared/supabase.ts';
import { getWallet } from '../_shared/wallet.ts';

const WASM = new URL('./swiss_eph.wasm', import.meta.url);

type Session = { id: string; endsAt: string; minutes: number; messagesLeft: number } | null;

async function runningSession(userId: string, persona: Persona): Promise<Session> {
  if (persona.billing !== 'minute') return null;
  const { data, error } = await admin()
    .from('persona_sessions')
    .select('id, ends_at, minutes, messages')
    .match({ user_id: userId, persona_id: persona.id })
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, endsAt: data.ends_at, minutes: data.minutes, messagesLeft: Math.max(data.minutes * MESSAGES_PER_MINUTE - data.messages, 0) };
}

async function startSession(userId: string, persona: Persona, minutes: unknown) {
  if (persona.billing !== 'minute') return errorResponse(400, 'This persona is paid per message');
  if (typeof minutes !== 'number' || !SESSION_MINUTES.includes(minutes)) return errorResponse(400, `minutes must be one of ${SESSION_MINUTES.join(', ')}`);
  if (await runningSession(userId, persona)) return errorResponse(409, 'A session is already running');
  const { data, error } = await admin().rpc('start_persona_session', {
    p_user: userId,
    p_persona: persona.id,
    p_minutes: minutes,
    p_credits: minutes * persona.price,
  });
  if (error) throw error;
  if (!data) return json({ error: 'Not enough credits', wallet: await getWallet(userId) }, 402);
  return json({ session: await runningSession(userId, persona), wallet: await getWallet(userId) });
}

async function sendMessage(userId: string, persona: Persona, body: Record<string, unknown>) {
  const message = cleanQuestion(body.message);
  if (!message) return errorResponse(400, 'Please write a message (up to 1000 letters)');
  if (!isLanguage(body.language)) return errorResponse(400, 'unknown language');
  const { threadId, profile } = await resolveConversation(userId, body, persona.id);
  const db = admin();

  // Pay first (atomic), give back if the AI cannot answer.
  if (persona.billing === 'message') {
    const { data, error } = await db.rpc('spend_credits', { p_user: userId, p_amount: persona.price, p_reason: 'persona_message' });
    if (error) throw error;
    if (!data) return json({ error: 'Not enough credits', wallet: await getWallet(userId) }, 402);
  } else {
    const session = await runningSession(userId, persona);
    const cap = (session?.minutes ?? 0) * MESSAGES_PER_MINUTE;
    const { data, error } = session ? await db.rpc('use_session_message', { p_user: userId, p_persona: persona.id, p_cap: cap }) : { data: false, error: null };
    if (error) throw error;
    if (!data) return json({ error: 'No running session', needSession: true, wallet: await getWallet(userId) }, 409);
  }
  try {
    const result = await answer({ ownerId: userId, question: message, language: body.language, threadId, profile, persona, wasm: WASM });
    return json({ ...result, wallet: await getWallet(userId), session: await runningSession(userId, persona) });
  } catch (err) {
    if (persona.billing === 'message') await db.rpc('refund_credits', { p_user: userId, p_amount: persona.price });
    else await db.rpc('release_session_message', { p_user: userId, p_persona: persona.id });
    throw err;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const persona = personaById(url.searchParams.get('personaId'));
      if (!persona) return errorResponse(400, 'Unknown persona');
      const profileId = url.searchParams.get('profileId');
      if (profileId && !UUID.test(profileId)) return errorResponse(400, 'Invalid profileId');
      return json({
        wallet: await getWallet(user.id),
        session: await runningSession(user.id, persona),
        thread: await latestThread(user.id, profileId, persona.id),
      });
    }
    if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');
    const body = ((await readJson(req)) ?? {}) as Record<string, unknown>;
    const persona = personaById(body.personaId);
    if (!persona) return errorResponse(400, 'Unknown persona');
    if (body.action === 'start') return await startSession(user.id, persona, body.minutes);
    return await sendMessage(user.id, persona, body);
  } catch (err) {
    return chatErrorResponse(err, 'persona');
  }
});
