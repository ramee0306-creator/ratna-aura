// Paid tools: pay before use.
//
//   GET  /unlock                               -> { prices, premiumIncludes, mode }
//   GET  /unlock?feature=numbers&key=<text>    -> { unlocked, price, premiumIncludes, wallet }
//   POST /unlock { feature, key }              -> { status: 'already'|'premium'|'free'|'paid', wallet }
//                                              -> 402 { error, wallet }  not enough credits
//
// The key says what is unlocked (a person's name and birth date, a number, a month…); only its hash is stored.
// Palm readings are paid in supabase/functions/palm.
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { setting } from '../_shared/settings.ts';
import { admin, getUser } from '../_shared/supabase.ts';
import { isFeature, isUnlockKey, keyHash } from '../_shared/unlocks.ts';
import { featurePrices, getWallet, premiumIncludesTools } from '../_shared/wallet.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');
  const db = admin();

  try {
    const [prices, premiumIncludes] = await Promise.all([featurePrices(), premiumIncludesTools()]);

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const feature = url.searchParams.get('feature');
      if (feature === null) return json({ prices, premiumIncludes, mode: await setting('payments_mode', 'off') });
      const key = url.searchParams.get('key');
      if (!isFeature(feature) || feature === 'palm' || !isUnlockKey(key)) return errorResponse(400, 'Unknown tool');
      const { data, error } = await db
        .from('unlocks')
        .select('feature')
        .match({ user_id: user.id, feature, key_hash: await keyHash(feature, key) })
        .maybeSingle();
      if (error) throw error;
      return json({ unlocked: data !== null, price: prices[feature] ?? null, premiumIncludes, wallet: await getWallet(user.id) });
    }
    if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

    const body = ((await readJson(req)) ?? {}) as { feature?: unknown; key?: unknown };
    if (!isFeature(body.feature) || body.feature === 'palm' || !isUnlockKey(body.key)) return errorResponse(400, 'Unknown tool');
    const price = prices[body.feature];
    if (price === undefined) return errorResponse(503, 'This tool is not available right now');

    const { data: status, error } = await db.rpc('unlock_feature', {
      p_user: user.id,
      p_feature: body.feature,
      p_key_hash: await keyHash(body.feature, body.key),
      p_price: price,
      p_premium_included: premiumIncludes,
    });
    if (error) throw error;
    const wallet = await getWallet(user.id);
    if (status === 'none') return json({ error: 'Not enough credits', wallet }, 402);
    return json({ status, wallet });
  } catch (err) {
    console.error('unlock failed', err);
    return errorResponse(500, 'Something went wrong. Please try again.');
  }
});
