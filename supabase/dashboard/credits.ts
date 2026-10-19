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

// ---- credits/index.ts ----
// Question credits.
//
//   GET  /credits                    -> { wallet, packs, mode }
//   POST /credits  { "packId": "q10" } -> { wallet }   (TEST MODE ONLY: adds credits without payment)
//
// Real payments (Google Play through RevenueCat) replace the POST in a later milestone. Until then
// app_settings.payments_mode is 'test'; set it to 'off' to hide buying completely.

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
