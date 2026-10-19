// AUTO-GENERATED from supabase/functions/revenuecat — do not edit by hand.
// Paste this whole file into the Supabase dashboard function editor.
// Regenerate with: npm run bundle-functions
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

// ---- _shared/http.ts ----
// Small helpers shared by all server functions.

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, message: string, details?: unknown): Response {
  return json({ error: message, ...(details ? { details } : {}) }, status);
}

async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

// ---- _shared/supabase.ts ----
// Server-side Supabase access. Uses the SECRET service key, which exists only
// on the Supabase server — it is never shipped inside the mobile app.

let adminClient: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (!adminClient) {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not available');
    adminClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return adminClient;
}

/** Returns the signed-in user for this request, or null if the login token is missing/invalid. */
async function getUser(req: Request): Promise<User | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// ---- _shared/settings.ts ----
// Reading the app_settings table (switches the admin can change without an app update).

/** A setting's value, or `fallback` if it is missing or of the wrong type. */
async function setting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await admin().from('app_settings').select('value').eq('key', key).maybeSingle();
  const value = data?.value as unknown;
  return value !== undefined && value !== null && typeof value === typeof fallback ? (value as T) : fallback;
}

// ---- _shared/subscriptions.ts ----
// Premium subscription plans and RevenueCat subscription events. No network here, so it can be tested.
// Docs: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields

type Plan = {
  id: string;
  /** Google Play "product:base plan" id, as RevenueCat reports it */
  productId: string;
  months: number;
  priceInr: number;
  /** Credits added at the start of every paid period */
  bonusCredits: number;
  /** Free trial length in days (0 = none) */
  trialDays: number;
};

/** Keeps only well-formed plans from app_settings.subscription_plans. */
function cleanPlans(value: unknown): Plan[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (p): p is Plan =>
      !!p && typeof p === 'object' &&
      typeof p.id === 'string' && /^[a-z0-9_]{1,30}$/.test(p.id) &&
      typeof p.productId === 'string' && p.productId.length > 0 &&
      [1, 3, 6, 12].includes(p.months) &&
      typeof p.priceInr === 'number' && p.priceInr > 0 &&
      Number.isInteger(p.bonusCredits) && p.bonusCredits >= 0 &&
      Number.isInteger(p.trialDays) && p.trialDays >= 0 && p.trialDays <= 31,
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SubscriptionAction = {
  kind: 'subscription';
  userId: string;
  planId: string;
  status: 'active' | 'in_grace' | 'expired';
  periodEnd: string;
  willRenew: boolean;
  isTrial: boolean;
  originalTransactionId: string | null;
  /** Bonus credits for a newly paid period (not for free trials) */
  bonus: { credits: number; reference: string } | null;
};

/** What a RevenueCat subscription event means for us, or null if it is not one we handle. */
function subscriptionAction(body: unknown, plans: Plan[]): SubscriptionAction | null {
  const e = (body as { event?: Record<string, unknown> } | null)?.event;
  if (!e || typeof e !== 'object') return null;
  const type = String(e.type);
  if (!['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'CANCELLATION', 'BILLING_ISSUE', 'EXPIRATION'].includes(type)) return null;
  const userId = e.app_user_id;
  if (typeof userId !== 'string' || !UUID.test(userId)) return null;
  const plan = plans.find((p) => p.productId === e.product_id || p.id === e.product_id);
  if (!plan) return null;
  const expires = e.expiration_at_ms;
  if (typeof expires !== 'number' || !Number.isFinite(expires) || expires <= 0) return null;
  const isTrial = e.period_type === 'TRIAL';
  const transaction = typeof e.transaction_id === 'string' ? e.transaction_id : '';
  const paidPeriod = (type === 'INITIAL_PURCHASE' || type === 'RENEWAL') && !isTrial && transaction && plan.bonusCredits > 0;
  return {
    kind: 'subscription',
    userId: userId.toLowerCase(),
    planId: plan.id,
    status: type === 'EXPIRATION' ? 'expired' : type === 'BILLING_ISSUE' ? 'in_grace' : 'active',
    periodEnd: new Date(expires).toISOString(),
    willRenew: type !== 'CANCELLATION' && type !== 'EXPIRATION',
    isTrial,
    originalTransactionId: typeof e.original_transaction_id === 'string' ? e.original_transaction_id : null,
    bonus: paidPeriod ? { credits: plan.bonusCredits, reference: `play:${transaction}` } : null,
  };
}

/** End of a test subscription period that starts now. */
const periodEnd = (months: number, from = new Date()) => {
  const end = new Date(from);
  end.setUTCMonth(end.getUTCMonth() + months);
  return end.toISOString();
};

// ---- _shared/wallet.ts ----
// Question credits: how many a user has, and the price list.

type Premium = {
  planId: string;
  status: 'active' | 'in_grace' | 'expired';
  willRenew: boolean;
  isTrial: boolean;
  periodEnd: string;
  store: 'play' | 'test';
};
type Wallet = {
  credits: number;
  freeLeft: number;
  freeLimit: number;
  /** The running Premium subscription, or null */
  premium: Premium | null;
  /** Premium Ask AI questions left today (fair use) */
  premiumLeftToday: number;
  /** Premium Ask AI questions per day (fair use) */
  premiumDaily: number;
};
type CreditPack = { id: string; credits: number; priceInr: number };

const freeLimit = () => setting('free_questions', 3);
const premiumDaily = () => setting('premium_daily_questions', 30);
const subscriptionPlans = async (): Promise<Plan[]> => cleanPlans(await setting<unknown[]>('subscription_plans', []));

async function runningPremium(userId: string): Promise<Premium | null> {
  const { data, error } = await admin()
    .from('subscriptions')
    .select('plan_id, status, will_renew, is_trial, current_period_end, store')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.status === 'expired' || Date.parse(data.current_period_end) <= Date.now()) return null;
  return { planId: data.plan_id, status: data.status, willRenew: data.will_renew, isTrial: data.is_trial, periodEnd: data.current_period_end, store: data.store };
}

async function getWallet(userId: string): Promise<Wallet> {
  const [limit, daily, premium] = await Promise.all([freeLimit(), premiumDaily(), runningPremium(userId)]);
  const { data, error } = await admin()
    .from('wallets')
    .select('credits, free_questions_used, premium_day, premium_day_used')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const usedToday = data?.premium_day === today ? data.premium_day_used : 0;
  return {
    credits: data?.credits ?? 0,
    freeLeft: Math.max(limit - (data?.free_questions_used ?? 0), 0),
    freeLimit: limit,
    premium,
    premiumLeftToday: premium ? Math.max(daily - usedToday, 0) : 0,
    premiumDaily: daily,
  };
}

/** Packs from app_settings.credit_packs, keeping only well-formed entries. */
async function creditPacks(): Promise<CreditPack[]> {
  const packs = await setting<unknown[]>('credit_packs', []);
  return (Array.isArray(packs) ? packs : []).filter(
    (p): p is CreditPack =>
      !!p && typeof p === 'object' && typeof (p as CreditPack).id === 'string' &&
      Number.isInteger((p as CreditPack).credits) && (p as CreditPack).credits > 0 && typeof (p as CreditPack).priceInr === 'number',
  );
}

// ---- _shared/revenuecat.ts ----
// Understanding RevenueCat's purchase notifications (webhooks). No network here, so it can be tested.
// Docs: https://www.revenuecat.com/docs/integrations/webhooks

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type WebhookAction =
  | { kind: 'credit'; userId: string; credits: number; reference: string }
  | { kind: 'ignore'; reason: string };

/** Credit packs are one-time (consumable) Google Play products whose product id equals the pack id. */
function webhookAction(body: unknown, packs: CreditPack[]): WebhookAction {
  const event = (body as { event?: Record<string, unknown> } | null)?.event;
  if (!event || typeof event !== 'object') return { kind: 'ignore', reason: 'no event' };
  if (event.type !== 'NON_RENEWING_PURCHASE') return { kind: 'ignore', reason: `event ${String(event.type)}` };
  const userId = event.app_user_id;
  if (typeof userId !== 'string' || !UUID.test(userId)) return { kind: 'ignore', reason: 'not one of our user ids' };
  // Google Play product ids may carry a ":base-plan" suffix for subscriptions; one-time products do not.
  const productId = typeof event.product_id === 'string' ? event.product_id.split(':')[0] : '';
  const pack = packs.find((p) => p.id === productId);
  if (!pack) return { kind: 'ignore', reason: `unknown product ${productId}` };
  const reference = typeof event.transaction_id === 'string' && event.transaction_id ? event.transaction_id : typeof event.id === 'string' ? event.id : '';
  if (!reference) return { kind: 'ignore', reason: 'no transaction id' };
  return { kind: 'credit', userId: userId.toLowerCase(), credits: pack.credits, reference: `play:${reference}` };
}

/** Compares the shared secret without leaking how much of it matched. */
function sameSecret(given: string | null, expected: string | undefined): boolean {
  if (!given || !expected) return false;
  const a = new TextEncoder().encode(given.replace(/^Bearer\s+/i, ''));
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ---- revenuecat/index.ts ----
// Receives purchase notifications from RevenueCat (which checks Google Play): adds bought credits and
// keeps the Premium subscription up to date (purchase, renewal, cancellation, payment problem, expiry).
//
//   POST /revenuecat   Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>   body: RevenueCat webhook event
//
// Set up in RevenueCat → Project → Integrations → Webhooks (see README → Payments).
// Each Play order is credited once (the database refuses a second credit with the same reference).

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
