// AUTO-GENERATED from supabase/functions/unlock — do not edit by hand.
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

// ---- unlock/index.ts ----
// Paid tools: pay before use.
//
//   GET  /unlock                               -> { prices, premiumIncludes, mode }
//   GET  /unlock?feature=numbers&key=<text>    -> { unlocked, price, premiumIncludes, wallet }
//   POST /unlock { feature, key }              -> { status: 'already'|'premium'|'free'|'paid', wallet }
//                                              -> 402 { error, wallet }  not enough credits
//
// The key says what is unlocked (a person's name and birth date, a number, a month…); only its hash is stored.
// Palm readings are paid in supabase/functions/palm.

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
