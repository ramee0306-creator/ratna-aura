// AUTO-GENERATED from supabase/functions/admin — do not edit by hand.
// Paste this whole file into the Supabase dashboard function editor.
// Regenerate with: npm run bundle-functions
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

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
  subscription_plans: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 4 && cleanPlans(v).length === v.length && new Set(v.map((p) => p.id)).size === v.length,
  premium_daily_questions: (v) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 200,
  feature_prices: (v) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(cleanPrices(v)).length === Object.keys(v).length && Object.keys(v).every((k) => (FEATURES as readonly string[]).includes(k)),
  premium_includes_tools: (v) => typeof v === 'boolean',
  credit_packs: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 6 && v.every(isPack) && new Set(v.map((p) => p.id)).size === v.length,
};

const validSetting = (key: unknown, value: unknown): key is string =>
  typeof key === 'string' && Object.hasOwn(EDITABLE, key) && EDITABLE[key](value);

// ---- _shared/crypto.ts ----
// Field encryption for personal data (names, birth details).
//
// AES-256-GCM via the standard Web Crypto API, so the same code runs in
// Supabase Edge Functions (Deno) and in our Node tests.
//
// The key lives ONLY in the server secret DATA_ENCRYPTION_KEY (base64, 32 bytes).
// Stored format:  v<keyVersion>.<base64 iv>.<base64 ciphertext+tag>
// The owner's user id is bound in as "additional data", so a ciphertext copied
// onto another user's row will refuse to decrypt.

const ALGORITHM = 'AES-GCM';
const IV_BYTES = 12;

type KeyRing = { current: number; keys: Record<number, CryptoKey> };

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = fromBase64(base64Key.trim());
  if (raw.length !== 32) {
    throw new Error('DATA_ENCRYPTION_KEY must be 32 random bytes, base64-encoded');
  }
  return crypto.subtle.importKey('raw', raw, ALGORITHM, false, ['encrypt', 'decrypt']);
}

/**
 * Builds the key ring from environment values.
 * DATA_ENCRYPTION_KEY is version 1. To rotate later, add DATA_ENCRYPTION_KEY_V2
 * (and so on); new data uses the highest version, old data still decrypts.
 */
async function keyRingFromEnv(get: (name: string) => string | undefined): Promise<KeyRing> {
  const keys: Record<number, CryptoKey> = {};
  const v1 = get('DATA_ENCRYPTION_KEY');
  if (!v1) throw new Error('Server secret DATA_ENCRYPTION_KEY is not set');
  keys[1] = await importKey(v1);
  for (let v = 2; v <= 9; v++) {
    const value = get(`DATA_ENCRYPTION_KEY_V${v}`);
    if (value) keys[v] = await importKey(value);
  }
  return { current: Math.max(...Object.keys(keys).map(Number)), keys };
}

async function encryptJson(ring: KeyRing, value: unknown, ownerId: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, additionalData: new TextEncoder().encode(ownerId) },
    ring.keys[ring.current],
    plaintext,
  );
  return `v${ring.current}.${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

async function decryptJson<T>(ring: KeyRing, stored: string, ownerId: string): Promise<T> {
  const match = /^v(\d+)\.([A-Za-z0-9+/=]+)\.([A-Za-z0-9+/=]+)$/.exec(stored);
  if (!match) throw new Error('Encrypted value has an unknown format');
  const key = ring.keys[Number(match[1])];
  if (!key) throw new Error(`No key available for version ${match[1]}`);
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: fromBase64(match[2]), additionalData: new TextEncoder().encode(ownerId) },
    key,
    fromBase64(match[3]),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

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

// ---- _shared/birth-details.ts ----
// Checks and cleans the birth details a user submits, before they are encrypted.

const RELATIONS = ['self', 'spouse', 'partner', 'child', 'parent', 'sibling', 'friend', 'other'] as const;
const GENDERS = ['male', 'female', 'other'] as const;

type Relation = (typeof RELATIONS)[number];
type Gender = (typeof GENDERS)[number];

/** The personal part that gets encrypted. */
type BirthDetails = {
  fullName: string;
  gender: Gender;
  /** YYYY-MM-DD (local date at the birth place) */
  birthDate: string;
  /** HH:MM 24-hour local time, or null if the user does not know it */
  birthTime: string | null;
  birthPlace: {
    name: string;
    latitude: number;
    longitude: number;
    /** IANA time-zone name, e.g. Asia/Kolkata */
    timezone: string;
  };
};

type BirthProfileInput = BirthDetails & { relation: Relation; isPrimary: boolean };

type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function isRealDate(text: string, today: Date): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  // Allow up to one day ahead to cover time-zone differences around midnight.
  const tomorrow = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1);
  return real && y >= 1800 && date.getTime() <= tomorrow;
}

function validateBirthProfile(input: unknown, today = new Date()): ValidationResult<BirthProfileInput> {
  const errors: string[] = [];
  if (!isObject(input)) return { ok: false, errors: ['Body must be a JSON object'] };

  const fullName = typeof input.fullName === 'string' ? input.fullName.normalize('NFC').trim().replace(/\s+/g, ' ') : '';
  if (fullName.length < 1 || fullName.length > 100) errors.push('fullName must be 1–100 characters');

  const gender = input.gender as Gender;
  if (!GENDERS.includes(gender)) errors.push(`gender must be one of ${GENDERS.join(', ')}`);

  const relation = (input.relation ?? 'self') as Relation;
  if (!RELATIONS.includes(relation)) errors.push(`relation must be one of ${RELATIONS.join(', ')}`);

  const isPrimary = input.isPrimary === true;

  const birthDate = typeof input.birthDate === 'string' ? input.birthDate : '';
  if (!isRealDate(birthDate, today)) errors.push('birthDate must be a real past date in YYYY-MM-DD format');

  let birthTime: string | null = null;
  if (input.birthTime !== null && input.birthTime !== undefined) {
    if (typeof input.birthTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(input.birthTime)) {
      birthTime = input.birthTime;
    } else {
      errors.push('birthTime must be HH:MM (24-hour) or null');
    }
  }

  const place = isObject(input.birthPlace) ? input.birthPlace : null;
  let birthPlace: BirthDetails['birthPlace'] | null = null;
  if (!place) {
    errors.push('birthPlace is required');
  } else {
    const name = typeof place.name === 'string' ? place.name.trim() : '';
    const { latitude, longitude, timezone } = place;
    if (name.length < 1 || name.length > 200) errors.push('birthPlace.name must be 1–200 characters');
    if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors.push('birthPlace.latitude must be between -90 and 90');
    }
    if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors.push('birthPlace.longitude must be between -180 and 180');
    }
    if (typeof timezone !== 'string' || !isValidTimeZone(timezone)) {
      errors.push('birthPlace.timezone must be a valid IANA time zone, e.g. Asia/Kolkata');
    }
    birthPlace = { name, latitude: latitude as number, longitude: longitude as number, timezone: timezone as string };
  }

  if (errors.length > 0 || !birthPlace) return { ok: false, errors };
  return { ok: true, value: { fullName, gender, relation, isPrimary, birthDate, birthTime, birthPlace } };
}

/** Splits validated input into the encrypted part and the plain database columns. */
function splitForStorage(input: BirthProfileInput): {
  details: BirthDetails;
  columns: { relation: Relation; is_primary: boolean };
} {
  const { relation, isPrimary, ...details } = input;
  return { details, columns: { relation, is_primary: isPrimary } };
}

// ---- _shared/profiles.ts ----
// Reading saved birth profiles (their personal details are stored encrypted).


type ProfileRow = { id: string; relation: string; is_primary: boolean; data_enc: string; created_at: string };

const PROFILE_COLUMNS = 'id, relation, is_primary, data_enc, created_at';

type PublicProfile = BirthDetails & { id: string; relation: string; isPrimary: boolean; createdAt: string };

let ring: KeyRing | null = null;
const keyRing = async () => (ring ??= await keyRingFromEnv((name) => Deno.env.get(name)));

async function toPublic(row: ProfileRow, ownerId: string): Promise<PublicProfile> {
  const details = await decryptJson<BirthDetails>(await keyRing(), row.data_enc, ownerId);
  return { id: row.id, relation: row.relation, isPrimary: row.is_primary, createdAt: row.created_at, ...details };
}

/** One profile belonging to this user, or null. */
async function loadProfile(db: SupabaseClient, ownerId: string, id: string): Promise<PublicProfile | null> {
  const { data, error } = await db.from('birth_profiles').select(PROFILE_COLUMNS).eq('id', id).eq('owner_id', ownerId).maybeSingle();
  if (error) throw error;
  return data ? toPublic(data as ProfileRow, ownerId) : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
//   GET  /admin                                         -> { stats, settings, costUsd7d, reports }
//   POST /admin { action: "setting", key, value }        -> { settings }
//   POST /admin { action: "gift", contact, credits }     -> { credits }   contact = e-mail or phone with country code

async function settings() {
  const { data, error } = await admin().from('app_settings').select('key, value').order('key');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

type ReportRow = { id: string; user_id: string; feature: string; reason: string; note: string | null; content_enc: string | null; created_at: string };

/** The latest reported AI answers, for review. */
async function recentReports() {
  const { data, error } = await admin()
    .from('ai_reports')
    .select('id, user_id, feature, reason, note, content_enc, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  const ring = await keyRing();
  return Promise.all(
    (data as ReportRow[]).map(async (r) => ({
      id: r.id,
      feature: r.feature,
      reason: r.reason,
      note: r.note,
      createdAt: r.created_at,
      text: r.content_enc ? (await decryptJson<{ text: string }>(ring, r.content_enc, r.user_id).catch(() => ({ text: '' }))).text : '',
    })),
  );
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
      return json({ stats, settings: await settings(), costUsd7d: estimateCostUsd(usage), reports: await recentReports() });
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
