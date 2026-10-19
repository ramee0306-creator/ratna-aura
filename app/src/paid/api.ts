// Paid tools (pay before use) and palm reading, through the server. In demo mode everything stays in memory.
import { demoPay, demoWallet, type PaymentsMode, type Wallet } from "@/ai/api";
import { ApiError } from "@/kundli/api";
import { isDemoMode, supabase } from "@/lib/supabase";

export type Feature =
  | "kundli"
  | "milan"
  | "rashifal"
  | "panchang"
  | "numbers"
  | "loshu"
  | "name"
  | "vibrations"
  | "compatibility"
  | "palm";
export type Prices = Partial<Record<Feature, number>>;

export const DEMO_PRICES: Prices = {
  kundli: 40,
  milan: 30,
  rashifal: 10,
  panchang: 5,
  numbers: 20,
  loshu: 20,
  name: 30,
  vibrations: 10,
  compatibility: 20,
  palm: 30,
};

async function call<T>(
  path: string,
  method: "GET" | "POST",
  body?: object,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(path, {
    method,
    body,
  });
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
export async function getPrices(): Promise<{
  prices: Prices;
  premiumIncludes: boolean;
  mode: PaymentsMode;
}> {
  if (isDemoMode)
    return { prices: DEMO_PRICES, premiumIncludes: true, mode: "test" };
  return call("unlock", "GET");
}

export type Access = {
  unlocked: boolean;
  price: number | null;
  premiumIncludes: boolean;
  wallet: Wallet;
};

/** Whether this thing (a person, a number, a month…) is already paid for. */
export async function getAccess(
  feature: Feature,
  key: string,
): Promise<Access> {
  if (isDemoMode) {
    return {
      unlocked: demoUnlocked.has(`${feature}|${key.trim().toLowerCase()}`),
      price: DEMO_PRICES[feature] ?? null,
      premiumIncludes: true,
      wallet: demoWallet(),
    };
  }
  return call(
    `unlock?feature=${feature}&key=${encodeURIComponent(key)}`,
    "GET",
  );
}

export type UnlockResult =
  | { kind: "unlocked"; wallet: Wallet }
  | { kind: "noCredits"; wallet: Wallet };

/** Pays for this thing (or uses Premium) and unlocks it for good. */
export async function unlock(
  feature: Feature,
  key: string,
): Promise<UnlockResult> {
  if (isDemoMode) {
    const id = `${feature}|${key.trim().toLowerCase()}`;
    if (!demoUnlocked.has(id)) {
      if (demoPay(DEMO_PRICES[feature] ?? 0) === "none")
        return { kind: "noCredits", wallet: demoWallet() };
      demoUnlocked.add(id);
    }
    return { kind: "unlocked", wallet: demoWallet() };
  }
  try {
    const result = await call<{ wallet: Wallet }>("unlock", "POST", {
      feature,
      key,
    });
    return { kind: "unlocked", wallet: result.wallet };
  } catch (err) {
    if (err instanceof ApiError && err.status === 402)
      return {
        kind: "noCredits",
        wallet: (err.details as { wallet: Wallet }).wallet,
      };
    throw err;
  }
}

// ---- palm reading: pay first, then send the photos ----
export type PalmPhoto = {
  hand: "left" | "right";
  mediaType: "image/jpeg";
  data: string;
};
export type PalmReading = { id: string; createdAt: string; reading: string };
export type PalmInfo = {
  price: number | null;
  premiumIncludes: boolean;
  wallet: Wallet;
  ticket: string | null;
  readings: PalmReading[];
};
const demoPalm: { ticket: string | null; readings: PalmReading[] } = {
  ticket: null,
  readings: [],
};

export async function getPalm(): Promise<PalmInfo> {
  if (isDemoMode)
    return {
      price: DEMO_PRICES.palm ?? null,
      premiumIncludes: true,
      wallet: demoWallet(),
      ...demoPalm,
      readings: [...demoPalm.readings],
    };
  return call("palm", "GET");
}

/** Pays for one reading. The ticket is then used by readPalm (a paid, unused ticket is kept). */
export async function payPalm(): Promise<
  | { kind: "paid"; ticket: string; wallet: Wallet }
  | { kind: "noCredits"; wallet: Wallet }
> {
  if (isDemoMode) {
    if (!demoPalm.ticket) {
      if (demoPay(DEMO_PRICES.palm ?? 0) === "none")
        return { kind: "noCredits", wallet: demoWallet() };
      demoPalm.ticket = Math.random().toString(36).slice(2);
    }
    return { kind: "paid", ticket: demoPalm.ticket, wallet: demoWallet() };
  }
  try {
    const r = await call<{ ticket: string; wallet: Wallet }>("palm", "POST", {
      action: "pay",
    });
    return { kind: "paid", ...r };
  } catch (err) {
    if (err instanceof ApiError && err.status === 402)
      return {
        kind: "noCredits",
        wallet: (err.details as { wallet: Wallet }).wallet,
      };
    throw err;
  }
}

export type PalmResult =
  | { kind: "read"; reading: PalmReading; wallet: Wallet }
  /** The photos did not show a clear palm; the paid ticket stays for another try */
  | { kind: "notPalm"; message: string };

/** Reads the palm photos with a paid ticket. */
export async function readPalm(
  ticket: string,
  photos: PalmPhoto[],
  language: string,
  demoText: string,
): Promise<PalmResult> {
  if (isDemoMode) {
    const reading = {
      id: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      reading: demoText,
    };
    demoPalm.ticket = null;
    demoPalm.readings.unshift(reading);
    return { kind: "read", reading, wallet: demoWallet() };
  }
  try {
    const r = await call<PalmReading & { wallet: Wallet }>("palm", "POST", {
      ticket,
      photos,
      language,
    });
    return {
      kind: "read",
      reading: { id: r.id, createdAt: r.createdAt, reading: r.reading },
      wallet: r.wallet,
    };
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 422 &&
      (err.details as { notPalm?: boolean })?.notPalm
    ) {
      return {
        kind: "notPalm",
        message: (err.details as { message: string }).message,
      };
    }
    throw err;
  }
}
