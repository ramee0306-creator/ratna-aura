// AUTO-GENERATED from supabase/functions/admin — do not edit by hand.
// Paste this whole file into the Supabase dashboard function editor.
// Regenerate with: npm run bundle-functions
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

// ---- _shared/admin-settings.ts ----
// Which settings the admin panel may change, and how each value is checked.

const MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5'] as const;

/** Price per million tokens in US dollars (input, output), for the cost estimate. */
const MODEL_PRICES: Record<string, [number, number]> = {
  'claude-haiku-5-5': [0.1, 0.5],
  'claude-sonnet-5-5': [2, 10],
  'claude-opus-5-5': [4, 20],
};

function estimateCostUsd(usage: { model: string | null; inputTokens: number; outputTokens: number }[]): number {
  return usage.reduce((sum, u) => {
    const [inp, out] = MODEL_PRICES[u.model ?? ''] ?? MODEL_PRICES['claude-opus-5-5'];
    return sum + (u.inputTokens * inp + u.outputTokens * out) / 1_000_000;
  }, 0);
}

type Check = (value: unknown) => boolean;
const isPack = (p: unknown) => {
  const x = p as { id?: unknown; credits?: unknown; priceInr?: unknown };
  return (
    !!x && typeof x.id === 'string' && /^[a-z0-9_.]{1,40}$/.test(x.id) &&
    Number.isInteger(x.credits) && (x.credits as number) > 0 && (x.credits as number) <= 10_000 &&
    typeof x.priceInr === 'number' && x.priceInr > 0 && x.priceInr <= 100_000
  );
};

const EDITABLE: Record<string, Check> = {
  rashifal_model: (v) => (MODELS as readonly unknown[]).includes(v),
  chat_model: (v) => (MODELS as readonly unknown[]).includes(v),
  free_questions: (v) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 20,
  payments_mode: (v) => v === 'test' || v === 'off' || v === 'live',
  credit_packs: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 6 && v.every(isPack) && new Set(v.map((p) => p.id)).size === v.length,
};

const validSetting = (key: unknown, value: unknown): key is string =>
  typeof key === 'string' && Object.hasOwn(EDITABLE, key) && EDITABLE[key](value);

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

// ---- admin/index.ts ----
// Admin panel (only for accounts with profiles.is_admin = true).
//
//   GET  /admin                                         -> { stats, settings, costUsd7d }
//   POST /admin { action: "setting", key, value }        -> { settings }
//   POST /admin { action: "gift", contact, credits }     -> { credits }   contact = e-mail or phone with country code

async function settings() {
  const { data, error } = await admin().from('app_settings').select('key, value').order('key');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');
  const db = admin();
  const { data: me } = await db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!me?.is_admin) return errorResponse(403, 'Admins only');

  try {
    if (req.method === 'GET') {
      const { data: stats, error } = await db.rpc('admin_stats');
      if (error) throw error;
      const usage = (stats?.aiUsage7d ?? []) as { model: string | null; inputTokens: number; outputTokens: number }[];
      return json({ stats, settings: await settings(), costUsd7d: estimateCostUsd(usage) });
    }
    if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

    const body = ((await readJson(req)) ?? {}) as Record<string, unknown>;
    if (body.action === 'setting') {
      if (!validSetting(body.key, body.value)) return errorResponse(400, 'Not an allowed setting or value');
      const { error } = await db.from('app_settings').upsert({ key: body.key, value: body.value });
      if (error) throw error;
      console.log('admin setting changed', { by: user.id, key: body.key });
      return json({ settings: await settings() });
    }
    if (body.action === 'gift') {
      const credits = body.credits;
      if (typeof body.contact !== 'string' || !Number.isInteger(credits) || (credits as number) < 1 || (credits as number) > 1000) {
        return errorResponse(400, 'contact and credits (1–1000) are required');
      }
      const { data: target, error } = await db.rpc('find_user', { p_contact: body.contact });
      if (error) throw error;
      if (!target) return errorResponse(404, 'No user with that e-mail or phone');
      const { data: balance, error: giftError } = await db.rpc('add_credits', { p_user: target, p_credits: credits, p_reason: 'gift', p_reference: `admin:${user.id}` });
      if (giftError) throw giftError;
      console.log('admin gift', { by: user.id, credits });
      return json({ credits: balance });
    }
    return errorResponse(400, 'Unknown action');
  } catch (err) {
    console.error('admin failed', err instanceof Error ? err.message : err);
    return errorResponse(500, 'Something went wrong');
  }
});
