// AUTO-GENERATED from supabase/functions/credits — do not edit by hand.
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

// ---- _shared/unlocks.ts ----
// Paid tools: which tools cost credits, their prices, and the hash that names what was unlocked.
const FEATURES = ['kundli', 'milan', 'rashifal', 'panchang', 'numbers', 'loshu', 'name', 'vibrations', 'compatibility', 'palm'] as const;
type Feature = (typeof FEATURES)[number];
type Prices = Record<Feature, number>;

const isFeature = (value: unknown): value is Feature => typeof value === 'string' && (FEATURES as readonly string[]).includes(value);

/** Prices from app_settings.feature_prices; a missing or broken price means the tool is not sold (null). */
function cleanPrices(raw: unknown): Partial<Prices> {
  const out: Partial<Prices> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const f of FEATURES) {
    const v = (raw as Record<string, unknown>)[f];
    if (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 1000) out[f] = v as number;
  }
  return out;
}

/** What the app says was unlocked (e.g. "name|1990-05-14"): 1–300 characters. */
const isUnlockKey = (value: unknown): value is string => typeof value === 'string' && value.length >= 1 && value.length <= 300;

/** sha-256 (hex) of the feature and key, so names and numbers are not stored. */
async function keyHash(feature: Feature, key: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${feature}\u0000${key.normalize('NFC').trim().toLowerCase()}`);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
}

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
/** Prices of the paid tools (app_settings.feature_prices), and whether Premium includes them. */
const featurePrices = async () => cleanPrices(await setting<unknown>('feature_prices', {}));
const premiumIncludesTools = () => setting('premium_includes_tools', true);
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

// ---- credits/index.ts ----
// Question credits and the Premium subscription.
//
//   GET  /credits                              -> { wallet, packs, plans, mode }
//   POST /credits  { "packId": "q10" }          -> { wallet }   TEST MODE: adds credits without payment
//   POST /credits  { "planId": "monthly" }      -> { wallet }   TEST MODE: starts Premium without payment
//   POST /credits  { "action": "cancelTest" }   -> { wallet }   TEST MODE: turns off auto-renew (Premium runs to period end)
//
// Real payments go through Google Play (RevenueCat → supabase/functions/revenuecat). Until then
// app_settings.payments_mode is 'test'; 'off' hides buying; 'live' uses Google Play.

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
      // Like Google Play: a plan with a free trial starts with the trial, and bonus credits come with the first paid period.
      const trial = plan.trialDays > 0;
      const { error } = await db.rpc('set_subscription', {
        p_user: user.id,
        p_plan: plan.id,
        p_status: 'active',
        p_period_end: trial ? new Date(Date.now() + plan.trialDays * 86_400_000).toISOString() : periodEnd(plan.months),
        p_will_renew: true,
        p_is_trial: trial,
        p_store: 'test',
        p_original_transaction_id: null,
      });
      if (error) throw error;
      if (!trial && plan.bonusCredits > 0) {
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
