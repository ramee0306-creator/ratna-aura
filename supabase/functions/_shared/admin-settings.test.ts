import { describe, expect, it } from 'vitest';

import { estimateCostUsd, validSetting } from './admin-settings.ts';

describe('admin settings', () => {
  it('accept only known keys with sensible values', () => {
    expect(validSetting('chat_model', 'claude-haiku-5-5')).toBe(true);
    expect(validSetting('chat_model', 'gpt-5')).toBe(false);
    expect(validSetting('free_questions', 3)).toBe(true);
    expect(validSetting('free_questions', 500)).toBe(false);
    expect(validSetting('free_questions', '3')).toBe(false);
    expect(validSetting('payments_mode', 'off')).toBe(true);
    expect(validSetting('payments_mode', 'free')).toBe(false);
    expect(validSetting('credit_packs', [{ id: 'q10', credits: 10, priceInr: 49 }])).toBe(true);
    expect(validSetting('credit_packs', [{ id: 'q10', credits: 10, priceInr: 49 }, { id: 'q10', credits: 20, priceInr: 89 }])).toBe(false);
    expect(validSetting('credit_packs', [{ id: 'q10', credits: -1, priceInr: 49 }])).toBe(false);
    expect(validSetting('subscription_plans', [{ id: 'monthly', productId: 'premium:monthly', months: 1, priceInr: 249, bonusCredits: 20, trialDays: 0 }])).toBe(true);
    expect(validSetting('subscription_plans', [{ id: 'monthly', productId: 'premium:monthly', months: 2, priceInr: 249, bonusCredits: 20, trialDays: 0 }])).toBe(false);
    expect(validSetting('premium_daily_questions', 30)).toBe(true);
    expect(validSetting('is_admin', true)).toBe(false);
    expect(validSetting('toString', 'x')).toBe(false);
  });

  it('estimates AI cost from tokens', () => {
    // 1M input + 1M output tokens of Haiku = $0.10 + $0.50
    expect(estimateCostUsd([{ model: 'claude-haiku-5-5', inputTokens: 1_000_000, outputTokens: 1_000_000 }])).toBeCloseTo(0.6);
    expect(estimateCostUsd([{ model: 'claude-opus-5-5', inputTokens: 1000, outputTokens: 1000 }])).toBeCloseTo(0.024);
  });
});
