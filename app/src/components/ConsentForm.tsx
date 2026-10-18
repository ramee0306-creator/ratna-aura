import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { Checkbox } from './Checkbox';
import { Notice } from './Notice';

/** The privacy notice + "I am 18 or older" confirmation. */
export function ConsentForm({ onAccept }: { onAccept: () => Promise<void> }) {
  const { t } = useTranslation();
  const [isAdult, setIsAdult] = useState(false);
  const [agrees, setAgrees] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const points = [t('consent.point1'), t('consent.point2'), t('consent.point3'), t('consent.point4')];

  async function accept() {
    if (!isAdult || !agrees) {
      setError(t('consent.mustTick'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAccept();
    } catch {
      setError(t('common.tryAgain'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <AppText>{t('consent.intro')}</AppText>
      <Card style={styles.card}>
        {points.map((p) => (
          <View key={p} style={styles.point}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.gold} style={styles.icon} />
            <AppText style={styles.pointText}>{p}</AppText>
          </View>
        ))}
        <Link href="/privacy" style={styles.link}>
          <AppText variant="bodyStrong" style={{ color: colors.goldBright }}>
            {t('consent.readPolicy')} →
          </AppText>
        </Link>
      </Card>
      <Checkbox checked={isAdult} onChange={setIsAdult} label={t('consent.ageCheck')} />
      <Checkbox checked={agrees} onChange={setAgrees} label={t('consent.agreeCheck')} />
      {error ? <Notice text={error} /> : null}
      <Button title={t('consent.accept')} onPress={accept} loading={busy} disabled={!isAdult || !agrees} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  card: { gap: spacing.md },
  point: { flexDirection: 'row', gap: spacing.md },
  icon: { marginTop: 2 },
  pointText: { flex: 1 },
  link: { marginTop: spacing.xs },
});
