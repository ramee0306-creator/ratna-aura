import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { buyTestPack, type CreditPack, getCredits, type PaymentsMode, type Wallet } from '@/ai/api';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { ApiError } from '@/kundli/api';
import { colors, spacing } from '@/theme';

export default function CreditsScreen() {
  const { t } = useTranslation();
  const [data, setData] = useState<{ wallet: Wallet; packs: CreditPack[]; mode: PaymentsMode } | null>(null);
  const [failed, setFailed] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

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
      const wallet = await buyTestPack(pack);
      setData((d) => (d ? { ...d, wallet } : d));
      setMessage({ text: t('ai.credits.bought', { count: pack.credits }), tone: 'success' });
    } catch (err) {
      setMessage({ text: t(err instanceof ApiError && err.status === 429 ? 'ai.credits.limit' : 'ai.credits.failed'), tone: 'error' });
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
          {data.mode === 'test' ? (
            <>
              <Notice tone="info" text={t('ai.credits.testMode')} />
              {data.packs.map((pack) => (
                <Card key={pack.id} style={styles.pack}>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{t('ai.credits.pack', { count: pack.credits })}</AppText>
                    <AppText variant="caption">{t('ai.credits.price', { price: pack.priceInr })}</AppText>
                  </View>
                  <Button title={t('ai.credits.buy')} onPress={() => buy(pack)} loading={buying === pack.id} disabled={buying !== null} />
                </Card>
              ))}
            </>
          ) : (
            <Notice tone="info" text={t('ai.credits.off')} />
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
