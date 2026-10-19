import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { buyTestPack, type CreditPack, getCredits, type PaymentsMode, type Wallet } from '@/ai/api';
import { useAuth } from '@/auth/AuthProvider';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { ApiError } from '@/kundli/api';
import { buyFromStore, storeBillingAvailable, storePrices } from '@/payments/billing';
import { colors, spacing } from '@/theme';

export default function CreditsScreen() {
  const { t } = useTranslation();
  const [data, setData] = useState<{ wallet: Wallet; packs: CreditPack[]; mode: PaymentsMode } | null>(null);
  const [failed, setFailed] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' | 'info' } | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const { userId } = useAuth();
  const live = data?.mode === 'live';

  // In live mode, show Google Play's own local prices.
  useEffect(() => {
    if (!live || !userId || !data) return;
    storePrices(userId, data.packs.map((p) => p.id))
      .then(setPrices)
      .catch(() => undefined);
  }, [live, userId, data]);

  const load = useCallback(() => {
    setFailed(false);
    getCredits()
      .then(setData)
      .catch(() => setFailed(true));
  }, []);
  useFocusEffect(load);

  async function buy(pack: CreditPack) {
    setBuying(pack.id);
    setMessage(null);
    try {
      if (!live) {
        const wallet = await buyTestPack(pack);
        setData((d) => (d ? { ...d, wallet } : d));
        setMessage({ text: t('ai.credits.bought', { count: pack.credits }), tone: 'success' });
        return;
      }
      const before = data?.wallet.credits ?? 0;
      if ((await buyFromStore(userId!, pack.id)) === 'cancelled') {
        setMessage({ text: t('extra.store.cancelled'), tone: 'info' });
        return;
      }
      // The server adds the credits when Google Play confirms the payment: wait for it.
      setMessage({ text: t('extra.store.waiting'), tone: 'info' });
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const fresh = await getCredits();
        if (fresh.wallet.credits > before) {
          setData(fresh);
          setMessage({ text: t('extra.store.added'), tone: 'success' });
          return;
        }
      }
      setMessage({ text: t('extra.store.slow'), tone: 'info' });
    } catch (err) {
      const limit = err instanceof ApiError && err.status === 429;
      setMessage({ text: t(limit ? 'ai.credits.limit' : live ? 'extra.store.failed' : 'ai.credits.failed'), tone: 'error' });
    } finally {
      setBuying(null);
    }
  }

  return (
    <Screen>
      <BackHeader title={t('ai.credits.title')} />
      {failed ? (
        <View style={styles.gap}>
          <Notice text={t('ai.credits.failed')} />
          <Button variant="outline" title={t('kundli.retry')} onPress={load} />
        </View>
      ) : !data ? (
        <ActivityIndicator color={colors.gold} style={styles.loading} />
      ) : (
        <View style={styles.gap}>
          <Card style={styles.balance}>
            <AppText variant="caption">{t('ai.credits.balance')}</AppText>
            <AppText variant="display" style={styles.digits}>
              {data.wallet.credits}
            </AppText>
            <AppText variant="label">{t('ai.ask.credits', { count: data.wallet.credits })}</AppText>
            {data.wallet.freeLeft > 0 ? (
              <AppText variant="caption" style={{ color: colors.emeraldBright }}>
                {t('ai.ask.freeLeft', { count: data.wallet.freeLeft })}
              </AppText>
            ) : null}
          </Card>
          <AppText variant="caption">{t('ai.credits.intro')}</AppText>
          {message ? <Notice tone={message.tone} text={message.text} /> : null}
          {data.mode === 'off' || (live && !storeBillingAvailable) ? (
            <Notice tone="info" text={t(live ? 'extra.store.androidOnly' : 'ai.credits.off')} />
          ) : (
            <>
              {!live ? <Notice tone="info" text={t('ai.credits.testMode')} /> : null}
              {data.packs.map((pack) => (
                <Card key={pack.id} style={styles.pack}>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{t('ai.credits.pack', { count: pack.credits })}</AppText>
                    <AppText variant="caption">{prices[pack.id] ?? t('ai.credits.price', { price: pack.priceInr })}</AppText>
                  </View>
                  <Button title={t('ai.credits.buy')} onPress={() => buy(pack)} loading={buying === pack.id} disabled={buying !== null} />
                </Card>
              ))}
            </>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.lg },
  flex: { flex: 1 },
  loading: { marginTop: spacing.xl },
  balance: { alignItems: 'center', gap: 2 },
  digits: { fontVariant: ['lining-nums'] },
  pack: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
