// Reading saved birth profiles (their personal details are stored encrypted).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

import type { BirthDetails } from './birth-details.ts';
import { decryptJson, type KeyRing, keyRingFromEnv } from './crypto.ts';

export type ProfileRow = { id: string; relation: string; is_primary: boolean; data_enc: string; created_at: string };

export const PROFILE_COLUMNS = 'id, relation, is_primary, data_enc, created_at';

export type PublicProfile = BirthDetails & { id: string; relation: string; isPrimary: boolean; createdAt: string };

let ring: KeyRing | null = null;
export const keyRing = async () => (ring ??= await keyRingFromEnv((name) => Deno.env.get(name)));

export async function toPublic(row: ProfileRow, ownerId: string): Promise<PublicProfile> {
  const details = await decryptJson<BirthDetails>(await keyRing(), row.data_enc, ownerId);
  return { id: row.id, relation: row.relation, isPrimary: row.is_primary, createdAt: row.created_at, ...details };
}

/** One profile belonging to this user, or null. */
export async function loadProfile(db: SupabaseClient, ownerId: string, id: string): Promise<PublicProfile | null> {
  const { data, error } = await db.from('birth_profiles').select(PROFILE_COLUMNS).eq('id', id).eq('owner_id', ownerId).maybeSingle();
  if (error) throw error;
  return data ? toPublic(data as ProfileRow, ownerId) : null;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
