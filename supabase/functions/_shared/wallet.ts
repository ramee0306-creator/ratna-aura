// Question credits: how many a user has, and the price list.
import { setting } from './settings.ts';
import { admin } from './supabase.ts';

export type Wallet = { credits: number; freeLeft: number; freeLimit: number };
export type CreditPack = { id: string; credits: number; priceInr: number };

export const freeLimit = () => setting('free_questions', 3);

export async function getWallet(userId: string): Promise<Wallet> {
  const limit = await freeLimit();
  const { data, error } = await admin().from('wallets').select('credits, free_questions_used').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return { credits: data?.credits ?? 0, freeLeft: Math.max(limit - (data?.free_questions_used ?? 0), 0), freeLimit: limit };
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
