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

// ---- _shared/wallet.ts ----
// Question credits: how many a user has, and the price list.

type Wallet = { credits: number; freeLeft: number; freeLimit: number };
type CreditPack = { id: string; credits: number; priceInr: number };

const freeLimit = () => setting('free_questions', 3);

async function getWallet(userId: string): Promise<Wallet> {
  const limit = await freeLimit();
  const { data, error } = await admin().from('wallets').select('credits, free_questions_used').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return { credits: data?.credits ?? 0, freeLeft: Math.max(limit - (data?.free_questions_used ?? 0), 0), freeLimit: limit };
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
// Receives purchase notifications from RevenueCat (which checks Google Play) and adds the bought credits.
//
//   POST /revenuecat   Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>   body: RevenueCat webhook event
//
// Set up in RevenueCat → Project → Integrations → Webhooks (see README → Payments).
// Each Play order is credited once (the database refuses a second credit with the same reference).

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
