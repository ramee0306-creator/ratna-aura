// Admin panel (only for accounts with profiles.is_admin = true).
//
//   GET  /admin                                         -> { stats, settings, costUsd7d }
//   POST /admin { action: "setting", key, value }        -> { settings }
//   POST /admin { action: "gift", contact, credits }     -> { credits }   contact = e-mail or phone with country code
import { estimateCostUsd, validSetting } from '../_shared/admin-settings.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { admin, getUser } from '../_shared/supabase.ts';

async function settings() {
  const { data, error } = await admin().from('app_settings').select('key, value').order('key');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');
  const db = admin();
  const { data: me } = await db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!me?.is_admin) return errorResponse(403, 'Admins only');

  try {
    if (req.method === 'GET') {
      const { data: stats, error } = await db.rpc('admin_stats');
      if (error) throw error;
      const usage = (stats?.aiUsage7d ?? []) as { model: string | null; inputTokens: number; outputTokens: number }[];
      return json({ stats, settings: await settings(), costUsd7d: estimateCostUsd(usage) });
    }
    if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

    const body = ((await readJson(req)) ?? {}) as Record<string, unknown>;
    if (body.action === 'setting') {
      if (!validSetting(body.key, body.value)) return errorResponse(400, 'Not an allowed setting or value');
      const { error } = await db.from('app_settings').upsert({ key: body.key, value: body.value });
      if (error) throw error;
      console.log('admin setting changed', { by: user.id, key: body.key });
      return json({ settings: await settings() });
    }
    if (body.action === 'gift') {
      const credits = body.credits;
      if (typeof body.contact !== 'string' || !Number.isInteger(credits) || (credits as number) < 1 || (credits as number) > 1000) {
        return errorResponse(400, 'contact and credits (1–1000) are required');
      }
      const { data: target, error } = await db.rpc('find_user', { p_contact: body.contact });
      if (error) throw error;
      if (!target) return errorResponse(404, 'No user with that e-mail or phone');
      const { data: balance, error: giftError } = await db.rpc('add_credits', { p_user: target, p_credits: credits, p_reason: 'gift', p_reference: `admin:${user.id}` });
      if (giftError) throw giftError;
      console.log('admin gift', { by: user.id, credits });
      return json({ credits: balance });
    }
    return errorResponse(400, 'Unknown action');
  } catch (err) {
    console.error('admin failed', err instanceof Error ? err.message : err);
    return errorResponse(500, 'Something went wrong');
  }
});
