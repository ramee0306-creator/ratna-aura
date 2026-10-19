// Pay before use: shows a tool's result only once it is paid for (or included in Premium).
// One payment unlocks one thing for good (a person, a pair, a number, a month…).
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { Wallet } from '@/ai/api';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/theme';

import { type Access, type Feature, getAccess, unlock } from './api';

type State = { kind: 'loading' } | { kind: 'failed' } | ({ kind: 'ready' } & Access);

/** Loads whether `key` is unlocked for `feature`, and pays for it. Checks again when the screen comes back into view. */
export function useAccess(feature: Feature, key: string) {
  const [state, setState] = useState<State & { key?: string }>({ kind: 'loading' });
  const [paying, setPaying] = useState(false);
  const [problem, setProblem] = useState<'failed' | 'noCredits' | null>(null);

  const load = useCallback(() => {
    let live = true;
    getAccess(feature, key)
      .then((a) => live && setState({ kind: 'ready', key, ...a }))
      .catch(() => live && setState({ kind: 'failed', key }));
    return () => {
      live = false;
    };
  }, [feature, key]);
  useFocusEffect(load);

  async function pay() {
    setPaying(true);
    setProblem(null);
    try {
      const result = await unlock(feature, key);
      setState((s) => (s.kind === 'ready' ? { ...s, wallet: result.wallet, unlocked: result.kind === 'unlocked' } : s));
      if (result.kind === 'noCredits') setProblem('noCredits');
    } catch {
      setProblem('failed');
    } finally {
      setPaying(false);
    }
  }

  // A different key (another person or number) waits for its own answer.
  const current: State = state.key === key ? state : { kind: 'loading' };
  return { state: current, pay, paying, problem, reload: load };
}

/** The "pay to see the result" card. */
export function PayCard({
  what,
  price,
  wallet,
  premiumIncludes,
  onPay,
  paying,
  problem,
}: {
  what: string;
  price: number;
  wallet: Wallet;
  premiumIncludes: boolean;
  onPay: () => void;
  paying: boolean;
  problem: 'failed' | 'noCredits' | null;
}) {
  const { t } = useTranslation();
  const premium = premiumIncludes && wallet.premium !== null;
  const enough = premium || wallet.credits >= price;
  return (
    <Card style={styles.card}>
      <View style={styles.lock}>
        <MaterialCommunityIcons name="lock-outline" size={28} color={colors.backgroundDeep} />
      </View>
      <AppText variant="heading" style={styles.center}>
        {t('extra.paid.title')}
      </AppText>
      <AppText style={styles.center}>{what}</AppText>
      {premium ? (
        <AppText variant="label" style={[styles.center, { color: colors.emeraldBright }]}>
          {t('extra.paid.includedInPremium')}
        </AppText>
      ) : (
        <>
          <AppText variant="display" style={[styles.center, styles.price]}>
            {t('extra.paid.price', { count: price })}
          </AppText>
          <AppText variant="caption" style={styles.center}>
            {t('extra.paid.once')} · {t('extra.paid.balance', { count: wallet.credits })}
          </AppText>
        </>
      )}
      {problem === 'failed' ? <Notice text={t('extra.paid.failed')} /> : null}
      {!enough || problem === 'noCredits' ? <Notice tone="info" text={t('extra.paid.notEnough')} /> : null}
      {enough ? (
        <Button
          title={premium ? t('extra.paid.seePremium') : t('extra.paid.pay', { count: price })}
          onPress={onPay}
          loading={paying}
        />
      ) : (
        <Button title={t('ai.ask.buy')} onPress={() => router.push('/credits')} />
      )}
      {!premium && premiumIncludes ? (
        <Button variant="ghost" title={t('extra.paid.withPremium')} onPress={() => router.push('/premium')} />
      ) : null}
    </Card>
  );
}

type AccessHook = ReturnType<typeof useAccess>;

/** The pay card, a spinner or an error for a not-yet-open tool; `children` once it is open. */
function GateView({ access, what, children }: { access: AccessHook; what: string; children: ReactNode }) {
  const { t } = useTranslation();
  const { state, pay, paying, problem, reload } = access;
  if (state.kind === 'loading') return <ActivityIndicator color={colors.gold} style={styles.loading} />;
  if (state.kind === 'failed') {
    return (
      <View style={styles.gap}>
        <Notice text={t('extra.paid.loadFailed')} />
        <Button variant="outline" title={t('kundli.retry')} onPress={reload} />
      </View>
    );
  }
  if (state.unlocked || state.price === null) return <>{children}</>;
  return (
    <PayCard
      what={what}
      price={state.price}
      wallet={state.wallet}
      premiumIncludes={state.premiumIncludes}
      onPay={pay}
      paying={paying}
      problem={problem}
    />
  );
}

/** Shows `children` once `unlockKey` is paid for; until then the pay card (inside a screen's content). */
export function PaidGate({ feature, unlockKey, what, children }: { feature: Feature; unlockKey: string; what: string; children: ReactNode }) {
  const access = useAccess(feature, unlockKey);
  return (
    <GateView access={access} what={what}>
      {children}
    </GateView>
  );
}

/** Like PaidGate for a whole screen: the screen itself only opens (and loads its data) once paid for. */
export function PaidScreen({
  title,
  feature,
  unlockKey,
  what,
  children,
}: {
  title: string;
  feature: Feature;
  unlockKey: string;
  what: string;
  children: ReactNode;
}) {
  const access = useAccess(feature, unlockKey);
  const { state } = access;
  if (state.kind === 'ready' && (state.unlocked || state.price === null)) return <>{children}</>;
  return (
    <Screen>
      <BackHeader title={title} />
      <GateView access={access} what={what}>
        {children}
      </GateView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.md },
  card: { gap: spacing.md, alignItems: 'stretch', borderColor: colors.gold },
  lock: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  center: { textAlign: 'center' },
  price: { color: colors.goldBright, fontVariant: ['lining-nums'] },
  loading: { marginTop: spacing.xl },
});
