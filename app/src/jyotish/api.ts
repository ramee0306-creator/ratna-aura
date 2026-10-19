// Panchang and daily rashifal from the server. In demo mode (no server) samples are shown instead.
import type { Panchang } from '@ratna/kundli';

import { ApiError } from '@/kundli/api';
import { isDemoMode, supabase } from '@/lib/supabase';

export type Rashifal = {
  headline: string;
  overview: string;
  love: string;
  career: string;
  money: string;
  health: string;
  tip: string;
  luckyColour: string;
  luckyNumber: number;
};

export type PanchangPlace = { name: string; latitude: number; longitude: number; timezone: string };

export const DEFAULT_PLACE: PanchangPlace = { name: 'New Delhi, Delhi, India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' };

async function post<T>(name: string, body: object): Promise<{ data: T; status: number }> {
  const { data, error, response } = await supabase.functions.invoke(name, { method: 'POST', body });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status ?? 0;
    throw new ApiError(error.message, status);
  }
  return { data: data as T, status: response?.status ?? 200 };
}

export async function getPanchang(date: string, place: PanchangPlace): Promise<{ panchang: Panchang; sample: boolean }> {
  if (isDemoMode) return { panchang: require('./demo-panchang.json') as Panchang, sample: true };
  const { data } = await post<{ panchang: Panchang }>('panchang', { date, latitude: place.latitude, longitude: place.longitude, timezone: place.timezone });
  return { panchang: data.panchang, sample: false };
}

export type RashifalResult =
  | { state: 'ready'; rashifal: Rashifal; sample: boolean }
  /** Someone else's request is still writing it */
  | { state: 'pending' };

/** `day` is 'today' or 'tomorrow' (India time). Throws ApiError 503 when the rashifal is not switched on. */
export async function getRashifal(sign: number, language: string, day: 'today' | 'tomorrow'): Promise<RashifalResult> {
  if (isDemoMode) return { state: 'ready', rashifal: require('./demo-rashifal.json') as Rashifal, sample: true };
  const date = day === 'today' ? indiaDate(0) : indiaDate(1);
  const { data, status } = await post<{ rashifal?: Rashifal; pending?: boolean }>('rashifal', { sign, language, date });
  if (status === 202 || !data.rashifal) return { state: 'pending' };
  return { state: 'ready', rashifal: data.rashifal, sample: false };
}

/** YYYY-MM-DD in India, `days` from now. */
export function indiaDate(days: number, now = Date.now()): string {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
  const [y, m, d] = today.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
