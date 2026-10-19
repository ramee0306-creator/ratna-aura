// Receives purchase notifications from RevenueCat (which checks Google Play) and adds the bought credits.
//
//   POST /revenuecat   Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>   body: RevenueCat webhook event
//
// Set up in RevenueCat → Project → Integrations → Webhooks (see README → Payments).
// Each Play order is credited once (the database refuses a second credit with the same reference).
import { errorResponse, json, readJson } from '../_shared/http.ts';
import { sameSecret, webhookAction } from '../_shared/revenuecat.ts';
import { admin } from '../_shared/supabase.ts';
import { creditPacks } from '../_shared/wallet.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');
  if (!sameSecret(req.headers.get('Authorization'), Deno.env.get('REVENUECAT_WEBHOOK_SECRET'))) return errorResponse(401, 'Unauthorized');

  const action = webhookAction(await readJson(req), await creditPacks());
  if (action.kind === 'ignore') {
    console.log('revenuecat ignored', action.reason);
    return json({ ok: true });
  }
  const { error } = await admin().rpc('add_credits', { p_user: action.userId, p_credits: action.credits, p_reason: 'purchase', p_reference: action.reference });
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
