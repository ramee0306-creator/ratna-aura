import { describe, expect, it } from 'vitest';

import { cleanPlans, periodEnd, subscriptionAction } from './subscriptions.ts';

const plans = cleanPlans([
  { id: 'monthly', productId: 'premium:monthly', months: 1, priceInr: 199, bonusCredits: 20, trialDays: 0 },
  { id: 'yearly', productId: 'premium:yearly', months: 12, priceInr: 1499, bonusCredits: 240, trialDays: 7 },
  { id: 'bad', productId: '', months: 2, priceInr: 0, bonusCredits: -1, trialDays: 0 },
]);
const user = '1b4e28ba-2fa1-11d2-883f-0016d3cca427';
const END = Date.parse('2026-11-20T10:00:00Z');
const event = (extra: Record<string, unknown>) => ({
  event: { type: 'INITIAL_PURCHASE', app_user_id: user, product_id: 'premium:monthly', period_type: 'NORMAL', expiration_at_ms: END, transaction_id: 'GPA.1..0', original_transaction_id: 'GPA.1', ...extra },
});

describe('subscription plans', () => {
  it('drops malformed plans', () => {
    expect(plans.map((p) => p.id)).toEqual(['monthly', 'yearly']);
  });
  it('test periods end after the plan length', () => {
    expect(periodEnd(1, new Date('2026-10-20T00:00:00Z'))).toBe('2026-11-20T00:00:00.000Z');
    expect(periodEnd(12, new Date('2026-10-20T00:00:00Z'))).toBe('2027-10-20T00:00:00.000Z');
  });
});

describe('RevenueCat subscription events', () => {
  it('a paid purchase starts Premium and gives the bonus credits once', () => {
    expect(subscriptionAction(event({}), plans)).toEqual({
      kind: 'subscription',
      userId: user,
      planId: 'monthly',
      status: 'active',
      periodEnd: '2026-11-20T10:00:00.000Z',
      willRenew: true,
      isTrial: false,
      originalTransactionId: 'GPA.1',
      bonus: { credits: 20, reference: 'play:GPA.1..0' },
    });
  });

  it('a free trial gives Premium but no bonus credits; the first renewal does', () => {
    const trial = subscriptionAction(event({ product_id: 'premium:yearly', period_type: 'TRIAL' }), plans)!;
    expect(trial).toMatchObject({ planId: 'yearly', isTrial: true, bonus: null });
    const renewal = subscriptionAction(event({ type: 'RENEWAL', product_id: 'premium:yearly', transaction_id: 'GPA.1..1' }), plans)!;
    expect(renewal.bonus).toEqual({ credits: 240, reference: 'play:GPA.1..1' });
  });

  it('cancelling keeps Premium until the period ends; billing problems and expiry are recorded', () => {
    expect(subscriptionAction(event({ type: 'CANCELLATION' }), plans)).toMatchObject({ status: 'active', willRenew: false, bonus: null });
    expect(subscriptionAction(event({ type: 'BILLING_ISSUE' }), plans)).toMatchObject({ status: 'in_grace', bonus: null });
    expect(subscriptionAction(event({ type: 'EXPIRATION' }), plans)).toMatchObject({ status: 'expired', willRenew: false });
    expect(subscriptionAction(event({ type: 'UNCANCELLATION' }), plans)).toMatchObject({ status: 'active', willRenew: true });
  });

  it('ignores other events, unknown products and users', () => {
    expect(subscriptionAction(event({ type: 'NON_RENEWING_PURCHASE' }), plans)).toBeNull();
    expect(subscriptionAction(event({ product_id: 'other:plan' }), plans)).toBeNull();
    expect(subscriptionAction(event({ app_user_id: '$RCAnonymousID:x' }), plans)).toBeNull();
    expect(subscriptionAction(event({ expiration_at_ms: null }), plans)).toBeNull();
  });
});
