import { describe, expect, it } from 'vitest';

import type { Plan } from './api';
import { bestValuePlan, lowestMonthly, savingPercent } from './plans';

const DEMO_PLANS: Plan[] = [
  { id: 'monthly', productId: 'premium:monthly', months: 1, priceInr: 199, bonusCredits: 20, trialDays: 0 },
  { id: 'quarterly', productId: 'premium:quarterly', months: 3, priceInr: 499, bonusCredits: 60, trialDays: 0 },
  { id: 'yearly', productId: 'premium:yearly', months: 12, priceInr: 1499, bonusCredits: 240, trialDays: 7 },
];

describe('Premium plan prices', () => {
  it('works out the saving against paying monthly', () => {
    const [monthly, quarterly, yearly] = DEMO_PLANS;
    expect(savingPercent(monthly, DEMO_PLANS)).toBe(0);
    expect(savingPercent(quarterly, DEMO_PLANS)).toBe(16); // 499 vs 3 × 199
    expect(savingPercent(yearly, DEMO_PLANS)).toBe(37); // 1499 vs 12 × 199
  });

  it('marks the plan with the biggest saving as best value', () => {
    expect(bestValuePlan(DEMO_PLANS)?.id).toBe('yearly');
    expect(bestValuePlan([DEMO_PLANS[0]])).toBeUndefined();
  });

  it('shows the lowest price per month', () => {
    expect(lowestMonthly(DEMO_PLANS)).toBe('₹125');
    expect(lowestMonthly([])).toBeNull();
  });
});
