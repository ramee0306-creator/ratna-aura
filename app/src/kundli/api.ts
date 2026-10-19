// Talking to the server about saved people and their kundlis.
// In demo mode (no server) everything stays in memory and a sample chart is shown.
import type { Kundli } from '@ratna/kundli';
import * as Crypto from 'expo-crypto';

import { isDemoMode, supabase } from '@/lib/supabase';

export const RELATIONS = ['self', 'spouse', 'partner', 'child', 'parent', 'sibling', 'friend', 'other'] as const;
export type Relation = (typeof RELATIONS)[number];
export type Gender = 'male' | 'female' | 'other';

export type BirthProfileInput = {
  fullName: string;
  gender: Gender;
  relation: Relation;
  isPrimary: boolean;
  /** YYYY-MM-DD */
  birthDate: string;
  /** HH:MM 24-hour, or null if unknown */
  birthTime: string | null;
  birthPlace: { name: string; latitude: number; longitude: number; timezone: string };
};

export type BirthProfile = BirthProfileInput & { id: string; createdAt: string };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** The server's JSON answer, when there was one */
    readonly details?: unknown,
  ) {
    super(message);
  }
}

async function call<T>(name: string, options: { method: 'GET' | 'POST' | 'DELETE'; body?: unknown }): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { method: options.method, body: options.body as object });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status ?? 0;
    throw new ApiError(error.message, status);
  }
  return data as T;
}

// ---- demo mode ----
const demoProfiles: BirthProfile[] = [];
const demoKundli = () => require('./demo-kundli.json') as Kundli;
/** A second sample (Jaipur, 3 Feb 1993, 06:15), so Kundli Milan can be tried in demo mode. */
export const demoSecondKundli = () => require('./demo-kundli-2.json') as Kundli;

export async function listProfiles(): Promise<BirthProfile[]> {
  if (isDemoMode) return [...demoProfiles];
  return (await call<{ profiles: BirthProfile[] }>('birth-profiles', { method: 'GET' })).profiles;
}

export async function createProfile(input: BirthProfileInput): Promise<BirthProfile> {
  if (isDemoMode) {
    if (input.isPrimary) demoProfiles.forEach((p) => (p.isPrimary = false));
    const profile = { ...input, id: Crypto.randomUUID(), createdAt: new Date().toISOString() };
    demoProfiles.push(profile);
    return profile;
  }
  return (await call<{ profile: BirthProfile }>('birth-profiles', { method: 'POST', body: input })).profile;
}

export async function deleteProfile(id: string): Promise<void> {
  if (isDemoMode) {
    demoProfiles.splice(demoProfiles.findIndex((p) => p.id === id), 1);
    return;
  }
  await call(`birth-profiles?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function getKundli(profileId: string): Promise<{ profile: BirthProfile; kundli: Kundli; sample: boolean }> {
  if (isDemoMode) {
    const profile = demoProfiles.find((p) => p.id === profileId);
    if (!profile) throw new ApiError('Profile not found', 404);
    return { profile, kundli: demoKundli(), sample: true };
  }
  const result = await call<{ profile: BirthProfile; kundli: Kundli }>('kundli', { method: 'POST', body: { profileId } });
  return { ...result, sample: false };
}
