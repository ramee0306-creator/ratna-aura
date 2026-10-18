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

export type KeyRing = { current: number; keys: Record<number, CryptoKey> };

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

export async function importKey(base64Key: string): Promise<CryptoKey> {
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
export async function keyRingFromEnv(get: (name: string) => string | undefined): Promise<KeyRing> {
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

export async function encryptJson(ring: KeyRing, value: unknown, ownerId: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, additionalData: new TextEncoder().encode(ownerId) },
    ring.keys[ring.current],
    plaintext,
  );
  return `v${ring.current}.${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptJson<T>(ring: KeyRing, stored: string, ownerId: string): Promise<T> {
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
