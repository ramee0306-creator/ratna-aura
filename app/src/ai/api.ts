// "Ask AI" and question credits, through the server. In demo mode (no server) everything stays in memory.
import { ApiError } from '@/kundli/api';
import { isDemoMode, supabase } from '@/lib/supabase';

export type Wallet = { credits: number; freeLeft: number; freeLimit: number };
export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; distress: boolean; createdAt: string };
export type Thread = { id: string; profileId: string | null; messages: ChatMessage[] };
export type CreditPack = { id: string; credits: number; priceInr: number };
export type PaymentsMode = 'test' | 'off' | 'live';

async function call<T>(path: string, method: 'GET' | 'POST', body?: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(path, { method, body });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status ?? 0;
    throw new ApiError(error.message, status);
  }
  return data as T;
}

// ---- demo mode ----
const demo = {
  wallet: { credits: 0, freeLeft: 3, freeLimit: 3 } as Wallet,
  threads: new Map<string, Thread>(),
};
const demoKey = (profileId: string | null) => profileId ?? 'general';
const newId = () => Math.random().toString(36).slice(2);

/** The latest conversation about a person (or the general one), and the user's credits. */
export async function getChat(profileId: string | null): Promise<{ wallet: Wallet; thread: Thread | null }> {
  if (isDemoMode) return { wallet: { ...demo.wallet }, thread: demo.threads.get(demoKey(profileId)) ?? null };
  return call(`ask${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ''}`, 'GET');
}

export type AskResult =
  | { kind: 'answered'; threadId: string; answer: string; distress: boolean; wallet: Wallet }
  /** No free questions or credits left */
  | { kind: 'noCredits' };

export async function ask(input: { question: string; language: string; profileId: string | null; threadId: string | null }, demoAnswer: string): Promise<AskResult> {
  if (isDemoMode) {
    const w = demo.wallet;
    if (w.freeLeft > 0) w.freeLeft -= 1;
    else if (w.credits > 0) w.credits -= 1;
    else return { kind: 'noCredits' };
    const key = demoKey(input.profileId);
    const thread = demo.threads.get(key) ?? { id: newId(), profileId: input.profileId, messages: [] };
    const now = new Date().toISOString();
    thread.messages.push(
      { id: newId(), role: 'user', text: input.question, distress: false, createdAt: now },
      { id: newId(), role: 'assistant', text: demoAnswer, distress: false, createdAt: now },
    );
    demo.threads.set(key, thread);
    return { kind: 'answered', threadId: thread.id, answer: demoAnswer, distress: false, wallet: { ...w } };
  }
  try {
    const result = await call<{ threadId: string; answer: string; distress: boolean; wallet: Wallet }>('ask', 'POST', input);
    return { kind: 'answered', ...result };
  } catch (err) {
    if (err instanceof ApiError && err.status === 402) return { kind: 'noCredits' };
    throw err;
  }
}

export async function getCredits(): Promise<{ wallet: Wallet; packs: CreditPack[]; mode: PaymentsMode }> {
  if (isDemoMode) {
    return {
      wallet: { ...demo.wallet },
      packs: [
        { id: 'q10', credits: 10, priceInr: 49 },
        { id: 'q30', credits: 30, priceInr: 129 },
        { id: 'q100', credits: 100, priceInr: 349 },
      ],
      mode: 'test',
    };
  }
  return call('credits', 'GET');
}

/** Test mode only: adds the pack's credits without payment. */
export async function buyTestPack(pack: CreditPack): Promise<Wallet> {
  if (isDemoMode) {
    demo.wallet.credits += pack.credits;
    return { ...demo.wallet };
  }
  return (await call<{ wallet: Wallet }>('credits', 'POST', { packId: pack.id })).wallet;
}
