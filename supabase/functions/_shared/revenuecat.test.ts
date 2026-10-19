import { describe, expect, it } from 'vitest';

import { sameSecret, webhookAction } from './revenuecat.ts';

const packs = [
  { id: 'q10', credits: 10, priceInr: 49 },
  { id: 'q30', credits: 30, priceInr: 129 },
];
const user = '1b4e28ba-2fa1-11d2-883f-0016d3cca427';
const purchase = (extra: Record<string, unknown> = {}) => ({
  event: { type: 'NON_RENEWING_PURCHASE', app_user_id: user, product_id: 'q30', transaction_id: 'GPA.3344-5566', ...extra },
});

describe('RevenueCat webhook', () => {
  it('credits a one-time pack to our user, once per Play order', () => {
    expect(webhookAction(purchase(), packs)).toEqual({ kind: 'credit', userId: user, credits: 30, reference: 'play:GPA.3344-5566' });
  });

  it('ignores other events, unknown products and anonymous users', () => {
    expect(webhookAction({ event: { type: 'TEST' } }, packs).kind).toBe('ignore');
    expect(webhookAction(purchase({ type: 'CANCELLATION' }), packs).kind).toBe('ignore');
    expect(webhookAction(purchase({ product_id: 'q999' }), packs).kind).toBe('ignore');
    expect(webhookAction(purchase({ app_user_id: '$RCAnonymousID:abc' }), packs).kind).toBe('ignore');
    expect(webhookAction(purchase({ transaction_id: '', id: '' }), packs).kind).toBe('ignore');
    expect(webhookAction(null, packs).kind).toBe('ignore');
  });

  it('checks the shared secret', () => {
    expect(sameSecret('Bearer s3cret-value', 's3cret-value')).toBe(true);
    expect(sameSecret('s3cret-value', 's3cret-value')).toBe(true);
    expect(sameSecret('Bearer wrong-value', 's3cret-value')).toBe(false);
    expect(sameSecret(null, 's3cret-value')).toBe(false);
    expect(sameSecret('Bearer x', undefined)).toBe(false);
  });
});
