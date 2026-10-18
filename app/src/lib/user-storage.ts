// Small private values saved on this phone for one signed-in person
// (for example the name and date of birth used for numerology).
// On a phone they are encrypted (see secure-storage.ts); each person's data is kept separately.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { LargeSecureStore } from './secure-storage';

const store = Platform.OS === 'web' ? AsyncStorage : new LargeSecureStore();

/** Every name used with these helpers, so "delete my account" can remove them all. */
export const USER_DATA_NAMES = ['numerology.me', 'numerology.partner', 'numerology.system'] as const;
export type UserDataName = (typeof USER_DATA_NAMES)[number];

// SecureStore keys may only contain letters, numbers, ".", "-" and "_".
const keyFor = (userId: string, name: UserDataName) => `user.${userId.replace(/[^A-Za-z0-9_-]/g, '')}.${name}`;

export async function getUserData<T>(userId: string, name: UserDataName): Promise<T | null> {
  try {
    const raw = await store.getItem(keyFor(userId, name));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setUserData(userId: string, name: UserDataName, value: unknown): Promise<void> {
  await store.setItem(keyFor(userId, name), JSON.stringify(value));
}

export async function clearUserData(userId: string): Promise<void> {
  await Promise.all(USER_DATA_NAMES.map((name) => store.removeItem(keyFor(userId, name)).catch(() => undefined)));
}
