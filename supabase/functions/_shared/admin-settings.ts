// Which settings the admin panel may change, and how each value is checked.

import { cleanPlans } from './subscriptions.ts';

export const MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5'] as const;

/** Price per million tokens in US dollars (input, output), for the cost estimate. */
export const MODEL_PRICES: Record<string, [number, number]> = {
  'claude-haiku-5-5': [0.1, 0.5],
  'claude-sonnet-5-5': [2, 10],
  'claude-opus-5-5': [4, 20],
};

export function estimateCostUsd(usage: { model: string | null; inputTokens: number; outputTokens: number }[]): number {
  return usage.reduce((sum, u) => {
    const [inp, out] = MODEL_PRICES[u.model ?? ''] ?? MODEL_PRICES['claude-opus-5-5'];
    return sum + (u.inputTokens * inp + u.outputTokens * out) / 1_000_000;
  }, 0);
}

type Check = (value: unknown) => boolean;
const isPack = (p: unknown) => {
  const x = p as { id?: unknown; credits?: unknown; priceInr?: unknown };
  return (
    !!x && typeof x.id === 'string' && /^[a-z0-9_.]{1,40}$/.test(x.id) &&
    Number.isInteger(x.credits) && (x.credits as number) > 0 && (x.credits as number) <= 10_000 &&
    typeof x.priceInr === 'number' && x.priceInr > 0 && x.priceInr <= 100_000
  );
};

export const EDITABLE: Record<string, Check> = {
  rashifal_model: (v) => (MODELS as readonly unknown[]).includes(v),
  chat_model: (v) => (MODELS as readonly unknown[]).includes(v),
  free_questions: (v) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 20,
  payments_mode: (v) => v === 'test' || v === 'off' || v === 'live',
  subscription_plans: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 4 && cleanPlans(v).length === v.length && new Set(v.map((p) => p.id)).size === v.length,
  premium_daily_questions: (v) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 200,
  credit_packs: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 6 && v.every(isPack) && new Set(v.map((p) => p.id)).size === v.length,
};

export const validSetting = (key: unknown, value: unknown): key is string =>
  typeof key === 'string' && Object.hasOwn(EDITABLE, key) && EDITABLE[key](value);
