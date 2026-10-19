// Reading the app_settings table (switches the admin can change without an app update).
import { admin } from './supabase.ts';

/** A setting's value, or `fallback` if it is missing or of the wrong type. */
export async function setting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await admin().from('app_settings').select('value').eq('key', key).maybeSingle();
  const value = data?.value as unknown;
  return value !== undefined && value !== null && typeof value === typeof fallback ? (value as T) : fallback;
}
