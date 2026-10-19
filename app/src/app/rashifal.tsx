import AsyncStorage from '@react-native-async-storage/async-storage';
import { SIGNS } from '@ratna/kundli';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AIBadge } from '@/components/AIBadge';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { getRashifal, type Rashifal } from '@/jyotish/api';
import { ApiError } from '@/kundli/api';
import { colors, radius, spacing } from '@/theme';

const SIGN_KEY = 'rashifal.sign';
type Day = 'today' | 'tomorrow';
type State =
  | { kind: 'loading' }
  | { kind: 'ready'; rashifal: Rashifal; sample: boolean }
  | { kind: 'error'; message: 'failed' | 'notReady' | 'notEnabled' };

function SignPicker({ value, onChange }: { value: number | null; onChange: (sign: number) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.signs} accessibilityRole="radiogroup" accessibilityLabel={t('jyotish.rashifal.chooseSign')}>
      {SIGNS.map((sign, i) => {
        const active = value === i;
        return (
          <Pressable
            key={sign}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(i)}
            style={[styles.sign, active && styles.signActive]}
          >
            <AppText variant="caption" style={[styles.signText, active && { color: colors.backgroundDeep }]} numberOfLines={2}>
              {t(`kundli.signs.${sign}`)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Reading({ rashifal }: { rashifal: Rashifal }) {
  const { t } = useTranslation();
  const sections = ['love', 'career', 'money', 'health'] as const;
  return (
    <Card style={styles.reading}>
      <View style={styles.headRow}>
        <AppText variant="heading" style={styles.flex}>
          {rashifal.headline}
        </AppText>
        <AIBadge />
      </View>
      <View style={styles.section}>
        <AppText variant="label" style={{ color: colors.gold }}>
          {t('jyotish.rashifal.overview')}
        </AppText>
        <AppText>{rashifal.overview}</AppText>
      </View>
      {sections.map((s) => (
        <View key={s} style={styles.section}>
          <AppText variant="label" style={{ color: colors.gold }}>
            {t(`jyotish.rashifal.${s}`)}
          </AppText>
          <AppText>{rashifal[s]}</AppText>
        </View>
      ))}
      <View style={styles.tip}>
        <AppText variant="label" style={{ color: colors.emeraldBright }}>
          {t('jyotish.rashifal.tip')}
        </AppText>
        <AppText>{rashifal.tip}</AppText>
      </View>
      <View style={styles.luckyRow}>
        <View style={styles.lucky}>
          <AppText variant="caption">{t('jyotish.rashifal.luckyColour')}</AppText>
          <AppText variant="bodyStrong">{rashifal.luckyColour}</AppText>
        </View>
        <View style={styles.lucky}>
          <AppText variant="caption">{t('jyotish.rashifal.luckyNumber')}</AppText>
          <AppText variant="bodyStrong">{rashifal.luckyNumber}</AppText>
        </View>
      </View>
    </Card>
  );
}

export default function RashifalScreen() {
  const { t, i18n } = useTranslation();
  const [sign, setSign] = useState<number | null>(null);
  const [day, setDay] = useState<Day>('today');
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(SIGN_KEY)
      .then((v) => v !== null && Number(v) >= 0 && Number(v) < 12 && setSign(Number(v)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (sign === null) return;
    let cancelled = false;
    (async () => {
      setState({ kind: 'loading' });
      // While another request is writing the same reading, check back a few times.
      for (let tries = 0; tries < 6 && !cancelled; tries++) {
        try {
          const result = await getRashifal(sign, i18n.language, day);
          if (cancelled) return;
          if (result.state === 'ready') return setState({ kind: 'ready', rashifal: result.rashifal, sample: result.sample });
        } catch (err) {
          if (!cancelled) setState({ kind: 'error', message: err instanceof ApiError && err.status === 503 ? 'notEnabled' : 'failed' });
          return;
        }
        await new Promise((r) => setTimeout(r, 4000));
      }
      if (!cancelled) setState({ kind: 'error', message: 'notReady' });
    })();
    return () => {
      cancelled = true;
    };
  }, [sign, day, i18n.language, attempt]);

  function choose(s: number) {
    setSign(s);
    AsyncStorage.setItem(SIGN_KEY, String(s)).catch(() => undefined);
  }

  return (
    <Screen>
      <BackHeader title={t('jyotish.rashifal.title')} />
      <View style={styles.gap}>
        <AppText variant="caption">{t('jyotish.rashifal.intro')}</AppText>
        <SignPicker value={sign} onChange={choose} />
        {sign !== null ? (
          <>
            <Segmented<Day>
              value={day}
              onChange={setDay}
              options={(['today', 'tomorrow'] as const).map((d) => ({ value: d, label: t(`jyotish.rashifal.${d}`) }))}
            />
            {state.kind === 'loading' ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.gold} />
                <AppText variant="caption">{t('jyotish.rashifal.preparing')}</AppText>
              </View>
            ) : state.kind === 'error' ? (
              <View style={styles.gap}>
                <Notice tone={state.message === 'failed' ? 'error' : 'info'} text={t(`jyotish.rashifal.${state.message}`)} />
                <Button variant="outline" title={t('kundli.retry')} onPress={() => setAttempt((a) => a + 1)} />
              </View>
            ) : (
              <>
                {state.sample ? <Notice tone="info" text={t('jyotish.rashifal.demoNotice')} /> : null}
                <Reading rashifal={state.rashifal} />
                <AppText variant="caption" style={styles.center}>
                  {t('jyotish.rashifal.writtenByAi')}
                </AppText>
              </>
            )}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.lg },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  loading: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  signs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sign: {
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'CC',
  },
  signActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  signText: { textAlign: 'center', color: colors.text },
  reading: { gap: spacing.md },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  section: { gap: 2 },
  tip: { gap: 2, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.emerald },
  luckyRow: { flexDirection: 'row', gap: spacing.md },
  lucky: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.backgroundDeep, alignItems: 'center' },
});
