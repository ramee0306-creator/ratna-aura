// AUTO-GENERATED from supabase/functions/report — do not edit by hand.
// Paste this whole file into the Supabase dashboard function editor.
// Regenerate with: npm run bundle-functions
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

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

// ---- report/index.ts ----
// Reporting an AI answer (Google Play requires a way to flag offensive AI-generated content).
//
//   POST /report { feature, itemId?, reason, note?, text } -> { ok: true }
//     feature: 'ask' | 'persona' | 'palm' | 'rashifal' · reason: 'harmful' | 'wrong' | 'other'
//     text: the reported answer (kept encrypted, for the admin's review)

const FEATURES = ['ask', 'persona', 'palm', 'rashifal'];
const REASONS = ['harmful', 'wrong', 'other'];
/** Reports per user per day, so the table cannot be flooded. */
const REPORTS_PER_DAY = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse(405, 'Method not allowed');

  const user = await getUser(req);
  if (!user) return errorResponse(401, 'Please sign in again');

  const body = ((await readJson(req)) ?? {}) as { feature?: unknown; itemId?: unknown; reason?: unknown; note?: unknown; text?: unknown };
  if (typeof body.feature !== 'string' || !FEATURES.includes(body.feature)) return errorResponse(400, 'Unknown feature');
  if (typeof body.reason !== 'string' || !REASONS.includes(body.reason)) return errorResponse(400, 'Unknown reason');
  if (typeof body.text !== 'string' || !body.text.trim()) return errorResponse(400, 'Missing text');
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';
  const itemId = typeof body.itemId === 'string' ? body.itemId.slice(0, 100) : null;

  try {
    const db = admin();
    const { count, error: countError } = await db
      .from('ai_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 3600_000).toISOString());
    if (countError) throw countError;
    if ((count ?? 0) >= REPORTS_PER_DAY) return errorResponse(429, 'Too many reports today');

    const { error } = await db.from('ai_reports').insert({
      user_id: user.id,
      feature: body.feature,
      item_id: itemId,
      reason: body.reason,
      note: note || null,
      // Encrypted with the admin's key ring, bound to the reporter, like chats.
      content_enc: await encryptJson(await keyRing(), { text: body.text.slice(0, 12000) }, user.id),
    });
    if (error) throw error;
    return json({ ok: true });
  } catch (err) {
    console.error('report failed', err);
    return errorResponse(500, 'Something went wrong. Please try again.');
  }
});
