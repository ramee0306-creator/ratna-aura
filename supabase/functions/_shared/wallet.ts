// Question credits: how many a user has, and the price list.
import { setting } from './settings.ts';
import { cleanPlans, type Plan } from './subscriptions.ts';
import { admin } from './supabase.ts';
import { cleanPrices } from './unlocks.ts';

export type Premium = {
  planId: string;
  status: 'active' | 'in_grace' | 'expired';
  willRenew: boolean;
  isTrial: boolean;
  periodEnd: string;
  store: 'play' | 'test';
};
export type Wallet = {
  credits: number;
  freeLeft: number;
  freeLimit: number;
  /** The running Premium subscription, or null */
  premium: Premium | null;
  /** Premium Ask AI questions left today (fair use) */
  premiumLeftToday: number;
  /** Premium Ask AI questions per day (fair use) */
  premiumDaily: number;
};
export type CreditPack = { id: string; credits: number; priceInr: number };

export const freeLimit = () => setting('free_questions', 3);
export const premiumDaily = () => setting('premium_daily_questions', 30);
/** Prices of the paid tools (app_settings.feature_prices), and whether Premium includes them. */
export const featurePrices = async () => cleanPrices(await setting<unknown>('feature_prices', {}));
export const premiumIncludesTools = () => setting('premium_includes_tools', true);
export const subscriptionPlans = async (): Promise<Plan[]> => cleanPlans(await setting<unknown[]>('subscription_plans', []));

async function runningPremium(userId: string): Promise<Premium | null> {
  const { data, error } = await admin()
    .from('subscriptions')
    .select('plan_id, status, will_renew, is_trial, current_period_end, store')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.status === 'expired' || Date.parse(data.current_period_end) <= Date.now()) return null;
  return { planId: data.plan_id, status: data.status, willRenew: data.will_renew, isTrial: data.is_trial, periodEnd: data.current_period_end, store: data.store };
}

export async function getWallet(userId: string): Promise<Wallet> {
  const [limit, daily, premium] = await Promise.all([freeLimit(), premiumDaily(), runningPremium(userId)]);
  const { data, error } = await admin()
    .from('wallets')
    .select('credits, free_questions_used, premium_day, premium_day_used')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const usedToday = data?.premium_day === today ? data.premium_day_used : 0;
  return {
    credits: data?.credits ?? 0,
    freeLeft: Math.max(limit - (data?.free_questions_used ?? 0), 0),
    freeLimit: limit,
    premium,
    premiumLeftToday: premium ? Math.max(daily - usedToday, 0) : 0,
    premiumDaily: daily,
  };
}

/** Packs from app_settings.credit_packs, keeping only well-formed entries. */
export async function creditPacks(): Promise<CreditPack[]> {
  const packs = await setting<unknown[]>('credit_packs', []);
  return (Array.isArray(packs) ? packs : []).filter(
    (p): p is CreditPack =>
      !!p && typeof p === 'object' && typeof (p as CreditPack).id === 'string' &&
      Number.isInteger((p as CreditPack).credits) && (p as CreditPack).credits > 0 && typeof (p as CreditPack).priceInr === 'number',
  );
}
