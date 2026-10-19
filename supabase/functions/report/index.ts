// Reporting an AI answer (Google Play requires a way to flag offensive AI-generated content).
//
//   POST /report { feature, itemId?, reason, note?, text } -> { ok: true }
//     feature: 'ask' | 'persona' | 'palm' | 'rashifal' · reason: 'harmful' | 'wrong' | 'other'
//     text: the reported answer (kept encrypted, for the admin's review)
import { encryptJson } from '../_shared/crypto.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { keyRing } from '../_shared/profiles.ts';
import { admin, getUser } from '../_shared/supabase.ts';

const FEATURES = ['ask', 'persona', 'palm', 'rashifal'];
const REASONS = ['harmful', 'wrong', 'other'];
/** Reports per user per day, so the table cannot be flooded. */
const REPORTS_PER_DAY = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');

  const body = ((await readJson(req)) ?? {}) as { feature?: unknown; itemId?: unknown; reason?: unknown; note?: unknown; text?: unknown };
  if (typeof body.feature !== 'string' || !FEATURES.includes(body.feature)) return errorResponse(400, 'Unknown feature');
  if (typeof body.reason !== 'string' || !REASONS.includes(body.reason)) return errorResponse(400, 'Unknown reason');
  if (typeof body.text !== 'string' || !body.text.trim()) return errorResponse(400, 'Missing text');
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';
  const itemId = typeof body.itemId === 'string' ? body.itemId.slice(0, 100) : null;

  try {
    const db = admin();
    const { count, error: countError } = await db
      .from('ai_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 3600_000).toISOString());
    if (countError) throw countError;
    if ((count ?? 0) >= REPORTS_PER_DAY) return errorResponse(429, 'Too many reports today');

    const { error } = await db.from('ai_reports').insert({
      user_id: user.id,
      feature: body.feature,
      item_id: itemId,
      reason: body.reason,
      note: note || null,
      // Encrypted with the admin's key ring, bound to the reporter, like chats.
      content_enc: await encryptJson(await keyRing(), { text: body.text.slice(0, 12000) }, user.id),
    });
    if (error) throw error;
    return json({ ok: true });
  } catch (err) {
    console.error('report failed', err);
    return errorResponse(500, 'Something went wrong. Please try again.');
  }
});
