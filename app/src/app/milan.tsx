import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type Manglik, type MatchReport, matchKundlis } from '@ratna/kundli';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { type BirthProfile, demoSecondKundli, getKundli, listProfiles } from '@/kundli/api';
import { colors, radius, spacing } from '@/theme';

type Role = 'groom' | 'bride';

function PersonPicker({ role, people, value, onChange }: { role: Role; people: BirthProfile[]; value: string | null; onChange: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.gapSm} accessibilityRole="radiogroup" accessibilityLabel={t(`jyotish.milan.${role}`)}>
      <AppText variant="overline">{t(`jyotish.milan.${role}`)}</AppText>
      {people.map((p) => {
        const active = p.id === value;
        return (
          <Pressable
            key={p.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(p.id)}
            style={[styles.person, active && styles.personActive]}
          >
            <MaterialCommunityIcons name={active ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={active ? colors.gold : colors.textFaint} />
            <AppText style={styles.flex}>{p.fullName}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** "Boy · Girl" values of a koota, in words. */
function useKootaValue() {
  const { t } = useTranslation();
  return (koota: string, value: string) => {
    if (koota === 'grahaMaitri') return t(`kundli.bodies.${value}`);
    if (koota === 'tara') return t('jyotish.milan.taraCount', { count: Number(value) });
    if (koota === 'bhakoot') return t('jyotish.milan.bhakootCount', { count: Number(value) });
    return t(`jyotish.milan.values.${value}`);
  };
}

function ManglikCard({ name, m }: { name: string; m: Manglik }) {
  const { t } = useTranslation();
  return (
    <View style={styles.gapXs}>
      <View style={styles.titleRow}>
        <AppText variant="bodyStrong" style={styles.flex}>
          {name}
        </AppText>
        <AppText variant="label" style={{ color: m.manglik ? colors.goldBright : colors.emeraldBright }}>
          {t(m.manglik ? 'jyotish.milan.manglikYes' : 'jyotish.milan.manglikNo')}
        </AppText>
      </View>
      {m.fromLagna ? (
        <AppText variant="caption">{t('jyotish.milan.fromLagna', { house: m.fromLagna.house })}</AppText>
      ) : (
        <AppText variant="caption">{t('jyotish.milan.noTime')}</AppText>
      )}
      <AppText variant="caption">{t('jyotish.milan.fromMoon', { house: m.fromMoon.house })}</AppText>
      {m.softened ? <AppText variant="caption">{t('jyotish.milan.softened')}</AppText> : null}
    </View>
  );
}

function Result({ report, groom, bride }: { report: MatchReport; groom: string; bride: string }) {
  const { t } = useTranslation();
  const value = useKootaValue();
  const { milan } = report;
  const good = report.verdict !== 'low';
  return (
    <View style={styles.gap}>
      <Card style={[styles.total, { borderColor: good ? colors.gold : colors.border }]}>
        <AppText variant="overline">{t('jyotish.milan.total')}</AppText>
        <AppText variant="display">{t('jyotish.milan.points', { points: milan.total, max: 36 })}</AppText>
        <AppText variant="heading" style={styles.center}>
          {t(`jyotish.milan.verdicts.${report.verdict}`)}
        </AppText>
        <AppText variant="caption" style={styles.center}>
          {t('jyotish.milan.verdictNote')}
        </AppText>
      </Card>

      <Card style={styles.gapMd}>
        <View style={styles.titleRow}>
          <AppText variant="caption" style={styles.flex}>
            {groom} · {bride}
          </AppText>
        </View>
        {milan.kootas.map((k) => (
          <View key={k.koota} style={styles.koota}>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{t(`jyotish.milan.kootas.${k.koota}`)}</AppText>
              <AppText variant="caption">{t(`jyotish.milan.kootaHints.${k.koota}`)}</AppText>
              <AppText variant="caption" style={{ color: colors.textFaint }}>
                {value(k.koota, k.groom)} · {value(k.koota, k.bride)}
              </AppText>
            </View>
            <AppText variant="bodyStrong" style={{ color: k.points === k.max ? colors.emeraldBright : k.points === 0 ? colors.textFaint : colors.gold }}>
              {t('jyotish.milan.points', { points: k.points, max: k.max })}
            </AppText>
          </View>
        ))}
        {milan.nadiDosha.present ? (
          <AppText variant="caption">
            {t('jyotish.milan.nadiDosha')} {milan.nadiDosha.cancelled ? t('jyotish.milan.nadiSoftened') : ''}
          </AppText>
        ) : null}
        {milan.bhakootDosha.present ? (
          <AppText variant="caption">
            {t('jyotish.milan.bhakootDosha')} {milan.bhakootDosha.cancelled ? t('jyotish.milan.bhakootSoftened') : ''}
          </AppText>
        ) : null}
      </Card>

      <Card style={styles.gapMd}>
        <AppText variant="overline">{t('jyotish.milan.manglikTitle')}</AppText>
        <ManglikCard name={groom} m={report.groom} />
        <ManglikCard name={bride} m={report.bride} />
        <AppText>{t(`jyotish.milan.balance.${report.manglikBalance}`)}</AppText>
      </Card>

      <AppText variant="caption" style={styles.center}>
        {t('jyotish.milan.disclaimer')}
      </AppText>
    </View>
  );
}

export default function MilanScreen() {
  const { t } = useTranslation();
  const [people, setPeople] = useState<BirthProfile[] | null>(null);
  const [groom, setGroom] = useState<string | null>(null);
  const [bride, setBride] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ report: MatchReport; sample: boolean } | null>(null);

  const load = useCallback(() => {
    setFailed(false);
    listProfiles()
      .then((list) => {
        setPeople(list);
        // Suggest the first man and the first woman.
        setGroom((g) => g ?? list.find((p) => p.gender === 'male')?.id ?? null);
        setBride((b) => b ?? list.find((p) => p.gender === 'female')?.id ?? null);
      })
      .catch(() => setFailed(true));
  }, []);
  useFocusEffect(load);

  async function match() {
    if (!groom || !bride || groom === bride) return;
    setBusy(true);
    setFailed(false);
    try {
      const [g, b] = await Promise.all([getKundli(groom), getKundli(bride)]);
      // In demo mode both would be the same sample, so use a second sample for the girl.
      const brideKundli = b.sample ? demoSecondKundli() : b.kundli;
      setResult({ report: matchKundlis(g.kundli, brideKundli), sample: g.sample });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const name = (id: string | null) => people?.find((p) => p.id === id)?.fullName ?? '';

  return (
    <Screen>
      <BackHeader title={t('jyotish.milan.title')} />
      <View style={styles.gap}>
        <AppText variant="caption">{t('jyotish.milan.intro')}</AppText>
        {failed ? <Notice text={t('jyotish.milan.failed')} /> : null}
        {people === null ? (
          failed ? (
            <Button variant="outline" title={t('kundli.retry')} onPress={load} />
          ) : (
            <ActivityIndicator color={colors.gold} style={styles.loading} />
          )
        ) : result ? (
          <>
            {result.sample ? <Notice tone="info" text={t('jyotish.milan.demoNotice')} /> : null}
            <Result report={result.report} groom={name(groom)} bride={name(bride)} />
            <Button variant="outline" title={t('jyotish.milan.again')} onPress={() => setResult(null)} />
          </>
        ) : people.length < 2 ? (
          <>
            <AppText>{t('jyotish.milan.needTwo')}</AppText>
            <Button title={t('jyotish.milan.addPerson')} onPress={() => router.push('/kundli/new')} />
          </>
        ) : (
          <>
            <PersonPicker role="groom" people={people} value={groom} onChange={setGroom} />
            <PersonPicker role="bride" people={people} value={bride} onChange={setBride} />
            {groom && groom === bride ? <Notice tone="info" text={t('jyotish.milan.samePerson')} /> : null}
            <Button title={t('jyotish.milan.match')} onPress={match} loading={busy} disabled={!groom || !bride || groom === bride} />
            <Button variant="ghost" title={t('jyotish.milan.addPerson')} onPress={() => router.push('/kundli/new')} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.lg },
  gapMd: { gap: spacing.md },
  gapSm: { gap: spacing.sm },
  gapXs: { gap: 2 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  loading: { marginTop: spacing.xl },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'CC',
  },
  personActive: { borderColor: colors.gold },
  total: { alignItems: 'center', gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  koota: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
