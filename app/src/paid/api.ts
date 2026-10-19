// Paid tools (pay before use) and palm reading, through the server. In demo mode everything stays in memory.
import { demoPay, demoWallet, type PaymentsMode, type Wallet } from '@/ai/api';
import { ApiError } from '@/kundli/api';
import { isDemoMode, supabase } from '@/lib/supabase';

export type Feature = 'kundli' | 'milan' | 'rashifal' | 'panchang' | 'numbers' | 'loshu' | 'name' | 'vibrations' | 'compatibility' | 'palm';
export type Prices = Partial<Record<Feature, number>>;

export const DEMO_PRICES: Prices = { kundli: 40, milan: 30, rashifal: 10, panchang: 5, numbers: 20, loshu: 20, name: 30, vibrations: 10, compatibility: 20, palm: 30 };

async function call<T>(path: string, method: 'GET' | 'POST', body?: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(path, { method, body });
  if (error) {
    const context = (error as { context?: Response }).context;
    const status = context?.status ?? 0;
    let details: unknown;
    try {
      details = await context?.json();
    } catch {
      details = undefined;
    }
    throw new ApiError(error.message, status, details);
  }
  return data as T;
}

const demoUnlocked = new Set<string>();

/** Prices of all tools (for the labels on the home screen). */
export async function getPrices(): Promise<{ prices: Prices; premiumIncludes: boolean; mode: PaymentsMode }> {
  if (isDemoMode) return { prices: DEMO_PRICES, premiumIncludes: true, mode: 'test' };
  return call('unlock', 'GET');
}

export type Access = { unlocked: boolean; price: number | null; premiumIncludes: boolean; wallet: Wallet };

/** Whether this thing (a person, a number, a month…) is already paid for. */
export async function getAccess(feature: Feature, key: string): Promise<Access> {
  if (isDemoMode) {
    return { unlocked: demoUnlocked.has(`${feature}|${key.trim().toLowerCase()}`), price: DEMO_PRICES[feature] ?? null, premiumIncludes: true, wallet: demoWallet() };
  }
  return call(`unlock?feature=${feature}&key=${encodeURIComponent(key)}`, 'GET');
}

export type UnlockResult = { kind: 'unlocked'; wallet: Wallet } | { kind: 'noCredits'; wallet: Wallet };

/** Pays for this thing (or uses Premium) and unlocks it for good. */
export async function unlock(feature: Feature, key: string): Promise<UnlockResult> {
  if (isDemoMode) {
    const id = `${feature}|${key.trim().toLowerCase()}`;
    if (!demoUnlocked.has(id)) {
      if (demoPay(DEMO_PRICES[feature] ?? 0) === 'none') return { kind: 'noCredits', wallet: demoWallet() };
      demoUnlocked.add(id);
    }
    return { kind: 'unlocked', wallet: demoWallet() };
  }
  try {
    const result = await call<{ wallet: Wallet }>('unlock', 'POST', { feature, key });
    return { kind: 'unlocked', wallet: result.wallet };
  } catch (err) {
    if (err instanceof ApiError && err.status === 402) return { kind: 'noCredits', wallet: (err.details as { wallet: Wallet }).wallet };
    throw err;
  }
}

// ---- palm reading ----
export type PalmPhoto = { hand: 'left' | 'right'; mediaType: 'image/jpeg'; data: string };
export type PalmReading = { id: string; createdAt: string; reading: string };
const demoReadings: PalmReading[] = [];

export async function getPalm(): Promise<{ price: number | null; premiumIncludes: boolean; wallet: Wallet; readings: PalmReading[] }> {
  if (isDemoMode) return { price: DEMO_PRICES.palm ?? null, premiumIncludes: true, wallet: demoWallet(), readings: [...demoReadings] };
  return call('palm', 'GET');
}

export type PalmResult =
  | { kind: 'read'; reading: PalmReading; wallet: Wallet }
  | { kind: 'noCredits'; wallet: Wallet }
  /** The photos did not show a clear palm; nothing was charged */
  | { kind: 'notPalm'; message: string; wallet: Wallet };

/** Pays for one reading and reads the palm photos. */
export async function readPalm(photos: PalmPhoto[], language: string, demoText: string): Promise<PalmResult> {
  if (isDemoMode) {
    if (demoPay(DEMO_PRICES.palm ?? 0) === 'none') return { kind: 'noCredits', wallet: demoWallet() };
    const reading = { id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString(), reading: demoText };
    demoReadings.unshift(reading);
    return { kind: 'read', reading, wallet: demoWallet() };
  }
  try {
    const r = await call<PalmReading & { wallet: Wallet }>('palm', 'POST', { photos, language });
    return { kind: 'read', reading: { id: r.id, createdAt: r.createdAt, reading: r.reading }, wallet: r.wallet };
  } catch (err) {
    if (err instanceof ApiError && err.status === 402) return { kind: 'noCredits', wallet: (err.details as { wallet: Wallet }).wallet };
    if (err instanceof ApiError && err.status === 422 && (err.details as { notPalm?: boolean })?.notPalm) {
      const d = err.details as { message: string; wallet: Wallet };
      return { kind: 'notPalm', message: d.message, wallet: d.wallet };
    }
    throw err;
  }
}
