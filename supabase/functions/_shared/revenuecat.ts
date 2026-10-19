// Understanding RevenueCat's purchase notifications (webhooks). No network here, so it can be tested.
// Docs: https://www.revenuecat.com/docs/integrations/webhooks
import type { CreditPack } from './wallet.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type WebhookAction =
  | { kind: 'credit'; userId: string; credits: number; reference: string }
  | { kind: 'ignore'; reason: string };

/** Credit packs are one-time (consumable) Google Play products whose product id equals the pack id. */
export function webhookAction(body: unknown, packs: CreditPack[]): WebhookAction {
  const event = (body as { event?: Record<string, unknown> } | null)?.event;
  if (!event || typeof event !== 'object') return { kind: 'ignore', reason: 'no event' };
  if (event.type !== 'NON_RENEWING_PURCHASE') return { kind: 'ignore', reason: `event ${String(event.type)}` };
  const userId = event.app_user_id;
  if (typeof userId !== 'string' || !UUID.test(userId)) return { kind: 'ignore', reason: 'not one of our user ids' };
  // Google Play product ids may carry a ":base-plan" suffix for subscriptions; one-time products do not.
  const productId = typeof event.product_id === 'string' ? event.product_id.split(':')[0] : '';
  const pack = packs.find((p) => p.id === productId);
  if (!pack) return { kind: 'ignore', reason: `unknown product ${productId}` };
  const reference = typeof event.transaction_id === 'string' && event.transaction_id ? event.transaction_id : typeof event.id === 'string' ? event.id : '';
  if (!reference) return { kind: 'ignore', reason: 'no transaction id' };
  return { kind: 'credit', userId: userId.toLowerCase(), credits: pack.credits, reference: `play:${reference}` };
}

/** Compares the shared secret without leaking how much of it matched. */
export function sameSecret(given: string | null, expected: string | undefined): boolean {
  if (!given || !expected) return false;
  const a = new TextEncoder().encode(given.replace(/^Bearer\s+/i, ''));
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
