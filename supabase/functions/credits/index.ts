// Question credits.
//
//   GET  /credits                    -> { wallet, packs, mode }
//   POST /credits  { "packId": "q10" } -> { wallet }   (TEST MODE ONLY: adds credits without payment)
//
// Real payments (Google Play through RevenueCat) replace the POST in a later milestone. Until then
// app_settings.payments_mode is 'test'; set it to 'off' to hide buying completely.
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { setting } from '../_shared/settings.ts';
import { admin, getUser } from '../_shared/supabase.ts';
import { creditPacks, getWallet } from '../_shared/wallet.ts';

/** Test purchases per user per day, so the test mode can't be used to pile up free credits. */
const TEST_PURCHASES_PER_DAY = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');

  try {
    const mode = await setting('payments_mode', 'off');
    if (req.method === 'GET') return json({ wallet: await getWallet(user.id), packs: await creditPacks(), mode });
    if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

    if (mode !== 'test') return errorResponse(403, 'Buying credits is not available yet');
    const body = (await readJson(req)) as { packId?: unknown } | undefined;
    const pack = (await creditPacks()).find((p) => p.id === body?.packId);
    if (!pack) return errorResponse(400, 'Unknown pack');

    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { count, error } = await admin()
      .from('credit_ledger')
      .select('id', { count: 'exact', head: true })
      .match({ user_id: user.id, reason: 'test_purchase' })
      .gte('created_at', since);
    if (error) throw error;
    if ((count ?? 0) >= TEST_PURCHASES_PER_DAY) return errorResponse(429, 'Test purchase limit reached for today');

    const { error: addError } = await admin().rpc('add_credits', { p_user: user.id, p_credits: pack.credits, p_reason: 'test_purchase', p_reference: null });
    if (addError) throw addError;
    return json({ wallet: await getWallet(user.id) });
  } catch (err) {
    console.error('credits failed', err instanceof Error ? err.message : err);
    return errorResponse(500, 'Something went wrong. Please try again.');
  }
});
