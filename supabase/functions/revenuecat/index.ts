// Receives purchase notifications from RevenueCat (which checks Google Play): adds bought credits and
// keeps the Premium subscription up to date (purchase, renewal, cancellation, payment problem, expiry).
//
//   POST /revenuecat   Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>   body: RevenueCat webhook event
//
// Set up in RevenueCat → Project → Integrations → Webhooks (see README → Payments).
// Each Play order is credited once (the database refuses a second credit with the same reference).
import { errorResponse, json, readJson } from '../_shared/http.ts';
import { sameSecret, webhookAction } from '../_shared/revenuecat.ts';
import { admin } from '../_shared/supabase.ts';
import { subscriptionAction } from '../_shared/subscriptions.ts';
import { creditPacks, subscriptionPlans } from '../_shared/wallet.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');
  if (!sameSecret(req.headers.get('Authorization'), Deno.env.get('REVENUECAT_WEBHOOK_SECRET'))) return errorResponse(401, 'Unauthorized');

  const body = await readJson(req);
  const db = admin();

  // Premium subscription events
  const sub = subscriptionAction(body, await subscriptionPlans());
  if (sub) {
    const { error } = await db.rpc('set_subscription', {
      p_user: sub.userId,
      p_plan: sub.planId,
      p_status: sub.status,
      p_period_end: sub.periodEnd,
      p_will_renew: sub.willRenew,
      p_is_trial: sub.isTrial,
      p_store: 'play',
      p_original_transaction_id: sub.originalTransactionId,
    });
    if (error) {
      if (error.code === '23503') return json({ ok: true, unknownUser: true });
      console.error('revenuecat subscription failed', error.message);
      return errorResponse(500, 'Could not update the subscription'); // RevenueCat will retry
    }
    if (sub.bonus) {
      const { error: bonusError } = await db.rpc('add_credits', { p_user: sub.userId, p_credits: sub.bonus.credits, p_reason: 'subscription', p_reference: sub.bonus.reference });
      if (bonusError && bonusError.code !== '23505') {
        console.error('revenuecat bonus failed', bonusError.message);
        return errorResponse(500, 'Could not add bonus credits');
      }
    }
    console.log('revenuecat subscription', { plan: sub.planId, status: sub.status, willRenew: sub.willRenew });
    return json({ ok: true });
  }

  // One-time credit packs
  const action = webhookAction(body, await creditPacks());
  if (action.kind === 'ignore') {
    console.log('revenuecat ignored', action.reason);
    return json({ ok: true });
  }
  const { error } = await db.rpc('add_credits', { p_user: action.userId, p_credits: action.credits, p_reason: 'purchase', p_reference: action.reference });
  if (error) {
    if (error.code === '23505') return json({ ok: true, duplicate: true }); // already credited
    if (error.code === '23503') {
      console.error('revenuecat: unknown user', action.userId);
      return json({ ok: true, unknownUser: true });
    }
    console.error('revenuecat failed', error.message);
    return errorResponse(500, 'Could not add credits'); // RevenueCat will retry
  }
  console.log('revenuecat credited', { credits: action.credits });
  return json({ ok: true });
});
