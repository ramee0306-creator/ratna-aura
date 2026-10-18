// The privacy notice + 18+ confirmation the user accepts before signing in.
// Stored on the phone until sign-in, then recorded on the server (accept_terms).
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Increase this when the privacy notice changes; users will be asked again. */
export const CURRENT_CONSENT_VERSION = 1;

const KEY = 'consent.pending';

type PendingConsent = { version: number; isAdult: true; acceptedAt: string };

export async function savePendingConsent(): Promise<void> {
  const value: PendingConsent = { version: CURRENT_CONSENT_VERSION, isAdult: true, acceptedAt: new Date().toISOString() };
  await AsyncStorage.setItem(KEY, JSON.stringify(value));
}

export async function getPendingConsent(): Promise<PendingConsent | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const value = raw ? (JSON.parse(raw) as PendingConsent) : null;
    return value?.version === CURRENT_CONSENT_VERSION && value.isAdult === true ? value : null;
  } catch {
    return null;
  }
}

export async function clearPendingConsent(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
