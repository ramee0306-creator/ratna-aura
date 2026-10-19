import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { brand } from '@brand';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { cancelTestSubscription, getCredits, type PaymentsMode, type Plan, subscribeTest, type Wallet } from '@/ai/api';
import { bestValuePlan, rupees, savingPercent } from '@/ai/plans';
import { useAuth } from '@/auth/AuthProvider';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { dateLocale } from '@/i18n';
import { ApiError } from '@/kundli/api';
import {
  MANAGE_SUBSCRIPTIONS_URL,
  restoreStorePurchases,
  storeBillingAvailable,
  type StorePlanPrice,
  subscribeInStore,
  subscriptionPrices,
} from '@/payments/billing';
import { colors, radius, spacing } from '@/theme';

type Message = { text: string; tone: 'success' | 'error' | 'info' };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PremiumScreen() {
  const { t, i18n } = useTranslation();
  const { userId } = useAuth();
  const [data, setData] = useState<{ wallet: Wallet; plans: Plan[]; mode: PaymentsMode } | null>(null);
  const [failed, setFailed] = useState(false);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<'subscribe' | 'restore' | 'cancel' | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [storePrices, setStorePrices] = useState<Record<string, StorePlanPrice>>({});
  const live = data?.mode === 'live';

  const load = useCallback(() => {
    setFailed(false);
    getCredits()
      .then(setData)
      .catch(() => setFailed(true));
  }, []);
  useFocusEffect(load);

  // In live mode, show Google Play's own local prices.
  useEffect(() => {
    if (!live || !userId || !data) return;
    subscriptionPrices(userId, data.plans.map((p) => p.productId))
      .then(setStorePrices)
      .catch(() => undefined);
  }, [live, userId, data]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(dateLocale(i18n.language), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

  if (failed || !data) {
    return (
      <Screen>
        <BackHeader title={t('extra.premium.title')} />
        {failed ? (
          <View style={styles.gap}>
            <Notice text={t('ai.credits.failed')} />
            <Button variant="outline" title={t('kundli.retry')} onPress={load} />
          </View>
        ) : (
          <ActivityIndicator color={colors.gold} style={styles.loading} />
        )}
      </Screen>
    );
  }

  const { wallet, plans, mode } = data;
  const premium = wallet.premium;
  const best = bestValuePlan(plans);
  const chosen = plans.find((p) => p.id === chosenId) ?? best ?? plans[0];
  const canBuy = mode === 'test' || (live && storeBillingAvailable);
  const priceOf = (plan: Plan) => storePrices[plan.productId]?.price ?? rupees(plan.priceInr);
  const perMonthOf = (plan: Plan) => storePrices[plan.productId]?.perMonth ?? rupees(plan.priceInr / plan.months);
  const planName = (id: string) => t(`extra.premium.plans.${id}`, { defaultValue: id });

  async function subscribe() {
    if (!chosen) return;
    setBusy('subscribe');
    setMessage(null);
    try {
      if (!live) {
        const fresh = await subscribeTest(chosen);
        setData((d) => (d ? { ...d, wallet: fresh } : d));
        setMessage({ text: t(fresh.premium?.isTrial ? 'extra.premium.welcomeTrial' : 'extra.premium.welcome'), tone: 'success' });
        return;
      }
      if ((await subscribeInStore(userId!, chosen.productId)) === 'cancelled') {
        setMessage({ text: t('extra.premium.cancelled'), tone: 'info' });
        return;
      }
      // The server turns Premium on when Google Play confirms the payment: wait for it.
      setMessage({ text: t('extra.premium.waiting'), tone: 'info' });
      for (let i = 0; i < 15; i++) {
        await wait(2000);
        const fresh = await getCredits();
        if (fresh.wallet.premium) {
          setData(fresh);
          setMessage({ text: t(fresh.wallet.premium.isTrial ? 'extra.premium.welcomeTrial' : 'extra.premium.welcome'), tone: 'success' });
          return;
        }
      }
      setMessage({ text: t('extra.premium.slow'), tone: 'info' });
    } catch (err) {
      const limit = err instanceof ApiError && err.status === 429;
      setMessage({ text: t(limit ? 'ai.credits.limit' : 'extra.premium.failed'), tone: 'error' });
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    setBusy('restore');
    setMessage(null);
    try {
      await restoreStorePurchases(userId!);
      for (let i = 0; i < 4; i++) {
        const fresh = await getCredits();
        if (fresh.wallet.premium) {
          setData(fresh);
          setMessage({ text: t('extra.premium.restored'), tone: 'success' });
          return;
        }
        await wait(2000);
      }
      setMessage({ text: t('extra.premium.nothingToRestore'), tone: 'info' });
    } catch {
      setMessage({ text: t('extra.store.failed'), tone: 'error' });
    } finally {
      setBusy(null);
    }
  }

  async function manage() {
    if (premium?.store === 'play') {
      Linking.openURL(`${MANAGE_SUBSCRIPTIONS_URL}?package=${brand.androidPackage}`);
      return;
    }
    setBusy('cancel');
    setMessage(null);
    try {
      const fresh = await cancelTestSubscription();
      setData((d) => (d ? { ...d, wallet: fresh } : d));
      setMessage({ text: t('extra.premium.cancelledTest'), tone: 'info' });
    } catch {
      setMessage({ text: t('extra.premium.failed'), tone: 'error' });
    } finally {
      setBusy(null);
    }
  }

  const benefits = [
    { icon: 'chat-processing-outline', text: t('extra.premium.benefits.ask', { count: wallet.premiumDaily }) },
    { icon: 'star-four-points-outline', text: t('extra.premium.benefits.bonus') },
    { icon: 'wallet-outline', text: t('extra.premium.benefits.keep') },
    { icon: 'calendar-remove-outline', text: t('extra.premium.benefits.cancel') },
  ] as const;

  return (
    <Screen>
      <BackHeader title={t('extra.premium.title')} />
      <View style={styles.gap}>
        <View style={styles.hero}>
          <View style={styles.crown}>
            <MaterialCommunityIcons name="crown-outline" size={34} color={colors.backgroundDeep} />
          </View>
          <AppText variant="title" style={styles.center}>
            {t('extra.premium.title')}
          </AppText>
          <AppText variant="caption" style={styles.center}>
            {t('extra.premium.tagline')}
          </AppText>
        </View>

        {premium ? (
          <Card style={[styles.gapSm, styles.statusCard]}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="check-decagram" size={22} color={colors.gold} />
              <AppText variant="heading">{t('extra.premium.status.title')}</AppText>
            </View>
            <AppText>{t('extra.premium.status.plan', { plan: planName(premium.planId) })}</AppText>
            <AppText variant="caption">
              {premium.isTrial
                ? t('extra.premium.status.trialEnds', { date: formatDate(premium.periodEnd) })
                : premium.willRenew
                  ? t('extra.premium.status.renews', { date: formatDate(premium.periodEnd) })
                  : t('extra.premium.status.ends', { date: formatDate(premium.periodEnd) })}
            </AppText>
            <AppText variant="label" style={{ color: colors.emeraldBright }}>
              {t('extra.premium.status.leftToday', { count: wallet.premiumLeftToday })}
            </AppText>
            {premium.status === 'in_grace' ? <Notice text={t('extra.premium.status.grace')} /> : null}
            {premium.store === 'play' ? (
              <Button
                variant="outline"
                title={t(premium.status === 'in_grace' ? 'extra.premium.updatePayment' : 'extra.premium.manage')}
                onPress={manage}
              />
            ) : premium.willRenew ? (
              <Button variant="outline" title={t('extra.premium.cancelTest')} onPress={manage} loading={busy === 'cancel'} disabled={busy !== null} />
            ) : null}
          </Card>
        ) : null}

        {message ? <Notice tone={message.tone} text={message.text} /> : null}

        <Card style={styles.gapSm}>
          {benefits.map((b) => (
            <View key={b.icon} style={styles.row}>
              <MaterialCommunityIcons name={b.icon} size={20} color={colors.gold} />
              <AppText style={styles.flex}>{b.text}</AppText>
            </View>
          ))}
        </Card>

        {premium ? null : !canBuy ? (
          <Notice tone="info" text={t(live ? 'extra.premium.androidOnly' : 'extra.premium.off')} />
        ) : (
          <>
            {!live ? <Notice tone="info" text={t('extra.premium.testMode')} /> : null}
            <View accessibilityRole="radiogroup" style={styles.gapSm}>
              {plans.map((plan) => {
                const selected = plan.id === chosen?.id;
                const saving = savingPercent(plan, plans);
                return (
                  <Pressable
                    key={plan.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => setChosenId(plan.id)}
                    style={[styles.plan, selected && styles.planSelected]}
                  >
                    {plan.id === best?.id ? (
                      <View style={styles.bestBadge}>
                        <AppText style={styles.bestText}>{t('extra.premium.bestValue')}</AppText>
                      </View>
                    ) : null}
                    <MaterialCommunityIcons
                      name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={22}
                      color={selected ? colors.gold : colors.textFaint}
                    />
                    <View style={styles.flex}>
                      <View style={styles.rowWrap}>
                        <AppText variant="bodyStrong">{planName(plan.id)}</AppText>
                        {saving > 0 ? (
                          <View style={styles.savePill}>
                            <AppText style={styles.saveText}>{t('extra.premium.save', { percent: saving })}</AppText>
                          </View>
                        ) : null}
                        {plan.trialDays > 0 ? (
                          <AppText variant="label" style={{ color: colors.emeraldBright }}>
                            {t('extra.premium.trial', { count: plan.trialDays })}
                          </AppText>
                        ) : null}
                      </View>
                      <AppText variant="caption">{t(`extra.premium.billed.${plan.id}`, { price: priceOf(plan), defaultValue: priceOf(plan) })}</AppText>
                      {plan.bonusCredits > 0 ? (
                        <AppText variant="caption" style={{ color: colors.textFaint }}>
                          {t('extra.premium.bonus', { count: plan.bonusCredits })}
                        </AppText>
                      ) : null}
                    </View>
                    <AppText variant="label" style={styles.perMonth}>
                      {t('extra.premium.perMonth', { price: perMonthOf(plan) })}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {chosen ? (
              <>
                <Button
                  title={t(chosen.trialDays > 0 ? 'extra.premium.startTrial' : 'extra.premium.subscribe')}
                  onPress={subscribe}
                  loading={busy === 'subscribe'}
                  disabled={busy !== null}
                />
                {chosen.trialDays > 0 ? (
                  <AppText variant="caption" style={styles.center}>
                    {t('extra.premium.trialNote', { count: chosen.trialDays, price: t(`extra.premium.billed.${chosen.id}`, { price: priceOf(chosen) }) })}
                  </AppText>
                ) : null}
              </>
            ) : null}
          </>
        )}

        {live && storeBillingAvailable ? (
          <Button variant="ghost" title={t('extra.premium.restore')} onPress={restore} loading={busy === 'restore'} disabled={busy !== null} />
        ) : null}

        <AppText variant="caption" style={styles.fine}>
          {t('extra.premium.fine')}
        </AppText>
        <View style={styles.links}>
          {brand.termsUrl ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(brand.termsUrl)} hitSlop={8}>
              <AppText variant="caption" style={{ color: colors.gold }}>
                {t('extra.privacy.terms')}
              </AppText>
            </Pressable>
          ) : null}
          {brand.privacyPolicyUrl ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(brand.privacyPolicyUrl)} hitSlop={8}>
              <AppText variant="caption" style={{ color: colors.gold }}>
                {t('extra.privacy.fullPolicy')}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.lg },
  gapSm: { gap: spacing.sm },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  loading: { marginTop: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  crown: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statusCard: { borderColor: colors.gold },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'CC',
  },
  planSelected: { borderColor: colors.gold, borderWidth: 2, backgroundColor: colors.surfaceRaised },
  bestBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.lg,
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
  },
  bestText: { fontSize: 11, lineHeight: 20, color: colors.backgroundDeep, fontWeight: '700' },
  savePill: { borderRadius: radius.pill, backgroundColor: colors.emeraldDeep, paddingHorizontal: 8 },
  saveText: { fontSize: 11, lineHeight: 18, color: colors.text },
  perMonth: { color: colors.goldBright, textAlign: 'right' },
  fine: { color: colors.textFaint },
  links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
});
