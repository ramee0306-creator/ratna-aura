// Question credits and the Premium subscription.
//
//   GET  /credits                              -> { wallet, packs, plans, mode }
//   POST /credits  { "packId": "q10" }          -> { wallet }   TEST MODE: adds credits without payment
//   POST /credits  { "planId": "monthly" }      -> { wallet }   TEST MODE: starts Premium without payment
//   POST /credits  { "action": "cancelTest" }   -> { wallet }   TEST MODE: turns off auto-renew (Premium runs to period end)
//
// Real payments go through Google Play (RevenueCat → supabase/functions/revenuecat). Until then
// app_settings.payments_mode is 'test'; 'off' hides buying; 'live' uses Google Play.
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { setting } from '../_shared/settings.ts';
import { periodEnd } from '../_shared/subscriptions.ts';
import { admin, getUser } from '../_shared/supabase.ts';
import { creditPacks, getWallet, subscriptionPlans } from '../_shared/wallet.ts';

/** Test purchases per user per day, so the test mode can't be used to pile up free credits. */
const TEST_PURCHASES_PER_DAY = 5;

async function testPurchasesToday(userId: string) {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count, error } = await admin()
    .from('credit_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('reason', ['test_purchase', 'test_subscription'])
    .gte('created_at', since);
  if (error) throw error;
  return count ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');
  const db = admin();

  try {
    const mode = await setting('payments_mode', 'off');
    if (req.method === 'GET') {
      return json({ wallet: await getWallet(user.id), packs: await creditPacks(), plans: await subscriptionPlans(), mode });
    }
    if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

    if (mode !== 'test') return errorResponse(403, 'Test purchases are switched off');
    const body = ((await readJson(req)) ?? {}) as { packId?: unknown; planId?: unknown; action?: unknown };

    if (body.action === 'cancelTest') {
      const { error } = await db.from('subscriptions').update({ will_renew: false, updated_at: new Date().toISOString() }).match({ user_id: user.id, store: 'test' });
      if (error) throw error;
      return json({ wallet: await getWallet(user.id) });
    }

    if ((await testPurchasesToday(user.id)) >= TEST_PURCHASES_PER_DAY) return errorResponse(429, 'Test purchase limit reached for today');

    if (body.planId !== undefined) {
      const plan = (await subscriptionPlans()).find((p) => p.id === body.planId);
      if (!plan) return errorResponse(400, 'Unknown plan');
      const { error } = await db.rpc('set_subscription', {
        p_user: user.id,
        p_plan: plan.id,
        p_status: 'active',
        p_period_end: periodEnd(plan.months),
        p_will_renew: true,
        p_is_trial: false,
        p_store: 'test',
        p_original_transaction_id: null,
      });
      if (error) throw error;
      if (plan.bonusCredits > 0) {
        const { error: bonusError } = await db.rpc('add_credits', { p_user: user.id, p_credits: plan.bonusCredits, p_reason: 'test_subscription', p_reference: null });
        if (bonusError) throw bonusError;
      }
      return json({ wallet: await getWallet(user.id) });
    }

    const pack = (await creditPacks()).find((p) => p.id === body.packId);
    if (!pack) return errorResponse(400, 'Unknown pack');
    const { error } = await db.rpc('add_credits', { p_user: user.id, p_credits: pack.credits, p_reason: 'test_purchase', p_reference: null });
    if (error) throw error;
    return json({ wallet: await getWallet(user.id) });
  } catch (err) {
    console.error('credits failed', err instanceof Error ? err.message : err);
    return errorResponse(500, 'Something went wrong. Please try again.');
  }
});
