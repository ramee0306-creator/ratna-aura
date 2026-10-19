// Admin panel calls (the server checks that the signed-in user is an admin).
import { ApiError } from '@/kundli/api';
import { isDemoMode, supabase } from '@/lib/supabase';

export type AdminStats = {
  users: number;
  newUsers7d: number;
  questionsToday: number;
  questions7d: number;
  aiUsage7d: { model: string | null; answers: number; inputTokens: number; outputTokens: number }[];
  rashifalToday: number;
  creditsBought7d: number;
  testCredits7d: number;
  creditsSpent7d: number;
};
export type AdminData = { stats: AdminStats; settings: Record<string, unknown>; costUsd7d: number };

async function call<T>(method: 'GET' | 'POST', body?: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin', { method, body });
  if (error) throw new ApiError(error.message, (error as { context?: { status?: number } }).context?.status ?? 0);
  return data as T;
}

const demoSettings: Record<string, unknown> = {
  chat_model: 'claude-haiku-5-5',
  rashifal_model: 'claude-haiku-5-5',
  free_questions: 3,
  payments_mode: 'test',
  feature_prices: { kundli: 40, milan: 30, rashifal: 10, panchang: 5, numbers: 20, loshu: 20, name: 30, vibrations: 10, compatibility: 20, palm: 30 },
  credit_packs: [
    { id: 'q10', credits: 10, priceInr: 49 },
    { id: 'q30', credits: 30, priceInr: 129 },
    { id: 'q100', credits: 100, priceInr: 349 },
  ],
};

export async function getAdmin(): Promise<AdminData> {
  if (isDemoMode) {
    return {
      stats: {
        users: 128,
        newUsers7d: 23,
        questionsToday: 41,
        questions7d: 260,
        aiUsage7d: [{ model: 'claude-haiku-5-5', answers: 310, inputTokens: 1_240_000, outputTokens: 210_000 }],
        rashifalToday: 36,
        creditsBought7d: 0,
        testCredits7d: 120,
        creditsSpent7d: 95,
      },
      settings: { ...demoSettings },
      costUsd7d: 0.23,
    };
  }
  return call('GET');
}

export async function setSetting(key: string, value: unknown): Promise<Record<string, unknown>> {
  if (isDemoMode) {
    demoSettings[key] = value;
    return { ...demoSettings };
  }
  return (await call<{ settings: Record<string, unknown> }>('POST', { action: 'setting', key, value })).settings;
}

export async function giftCredits(contact: string, credits: number): Promise<number> {
  if (isDemoMode) return credits;
  return (await call<{ credits: number }>('POST', { action: 'gift', contact, credits })).credits;
}
