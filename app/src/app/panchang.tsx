import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { karanaName, MONTHS, NAKSHATRAS, type Panchang, SIGNS, type Span, tithiName, type TimeRange, VARAS, YOGAS } from '@ratna/kundli';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { dateLocale } from '@/i18n';
import { getPanchang } from '@/jyotish/api';
import { PlaceSearch } from '@/places/PlaceSearch';
import type { Place } from '@/places/search';
import { colors, radius, spacing } from '@/theme';
import { currentMonth, monthLabel } from '@/paid/month';
import { PaidScreen } from '@/paid/PaidGate';

const PLACE_KEY = 'panchang.place';
const NEW_DELHI: Place = {
  name: 'New Delhi',
  state: 'Delhi',
  country: 'IN',
  countryName: 'India',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 'Asia/Kolkata',
  population: 0,
  label: 'New Delhi, Delhi, India',
};

/** YYYY-MM-DD of a moment in a time zone. */
const dayIn = (ms: number, timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms));

function addDays(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Formats times at the panchang's place; adds the date when it is not the panchang's own date. */
function useTimes(panchang: Panchang | null) {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const timeZone = panchang?.input.timezone ?? 'Asia/Kolkata';
    const locale = dateLocale(i18n.language);
    const time = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    });
    const day = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      timeZone,
    });
    const at = (ms: number | null) => {
      if (ms === null) return null;
      return dayIn(ms, timeZone) === panchang?.input.date ? time.format(ms) : `${time.format(ms)}, ${day.format(ms)}`;
    };
    return { at, range: (r: TimeRange) => `${at(r.start)} – ${at(r.end)}` };
  }, [panchang, i18n.language]);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <AppText variant="label" style={styles.rowLabel}>
        {label}
      </AppText>
      <View style={styles.flex}>{children}</View>
    </View>
  );
}

function PanchangView({ panchang }: { panchang: Panchang }) {
  const { t } = useTranslation();
  const { at, range } = useTimes(panchang);
  const spans = (list: Span[], name: (index: number) => string) =>
    list.map((s, i) => (
      <AppText key={`${s.index}-${s.start}`} style={i > 0 ? styles.later : undefined}>
        {name(s.index)} · {t('jyotish.panchang.until', { time: at(s.end) })}
      </AppText>
    ));
  const month = (index: number) => t(`jyotish.panchang.months.${MONTHS[index]}`);
  const amanta = panchang.month.adhika
    ? t('jyotish.panchang.adhika', { month: month(panchang.month.amanta) })
    : month(panchang.month.amanta);
  const purnimanta = panchang.month.adhika
    ? t('jyotish.panchang.adhika', { month: month(panchang.month.purnimanta) })
    : month(panchang.month.purnimanta);

  const sky = [
    {
      icon: 'weather-sunset-up',
      label: t('jyotish.panchang.sunrise'),
      value: at(panchang.sunrise),
    },
    {
      icon: 'weather-sunset-down',
      label: t('jyotish.panchang.sunset'),
      value: at(panchang.sunset),
    },
    {
      icon: 'moon-waxing-crescent',
      label: t('jyotish.panchang.moonrise'),
      value: at(panchang.moonrise),
    },
    {
      icon: 'moon-waning-crescent',
      label: t('jyotish.panchang.moonset'),
      value: at(panchang.moonset),
    },
  ] as const;

  return (
    <View style={styles.gap}>
      <View style={styles.skyGrid}>
        {sky.map((s) => (
          <View key={s.label} style={styles.skyTile}>
            <MaterialCommunityIcons name={s.icon} size={22} color={colors.gold} />
            <AppText variant="caption">{s.label}</AppText>
            <AppText variant="bodyStrong">{s.value ?? t('jyotish.panchang.none')}</AppText>
          </View>
        ))}
      </View>

      <Card style={styles.card}>
        <AppText variant="overline">{t('jyotish.panchang.limbs')}</AppText>
        <Row label={t('jyotish.panchang.vara')}>
          <AppText>{t(`jyotish.panchang.varas.${VARAS[panchang.vara]}`)}</AppText>
        </Row>
        <Row label={t('jyotish.panchang.tithi')}>
          <AppText variant="caption" style={{ color: colors.gold }}>
            {t(`jyotish.panchang.${panchang.paksha}`)}
          </AppText>
          {spans(panchang.tithi, (i) => t(`jyotish.panchang.tithis.${tithiName(i)}`))}
        </Row>
        <Row label={t('jyotish.panchang.nakshatra')}>{spans(panchang.nakshatra, (i) => t(`kundli.nakshatras.${NAKSHATRAS[i]}`))}</Row>
        <Row label={t('jyotish.panchang.yoga')}>{spans(panchang.yoga, (i) => t(`jyotish.panchang.yogas.${YOGAS[i]}`))}</Row>
        <Row label={t('jyotish.panchang.karana')}>{spans(panchang.karana, (i) => t(`jyotish.panchang.karanas.${karanaName(i)}`))}</Row>
        <Row label={t('jyotish.panchang.moonSign')}>{spans(panchang.moonSign, (i) => t(`kundli.signs.${SIGNS[i]}`))}</Row>
        <Row label={t('jyotish.panchang.sunSign')}>
          <AppText>{t(`kundli.signs.${SIGNS[panchang.sunSign]}`)}</AppText>
        </Row>
      </Card>

      <Card style={styles.card}>
        <AppText variant="overline">{t('jyotish.panchang.calendar')}</AppText>
        <AppText>{t('jyotish.panchang.amanta', { month: amanta })}</AppText>
        <AppText>{t('jyotish.panchang.purnimanta', { month: purnimanta })}</AppText>
        <AppText variant="caption">{t('jyotish.panchang.samvat', panchang.samvat)}</AppText>
      </Card>

      <Card style={[styles.card, { borderColor: colors.emerald }]}>
        <AppText variant="overline" style={{ color: colors.emeraldBright }}>
          {t('jyotish.panchang.goodTimes')}
        </AppText>
        <Row label={t('jyotish.panchang.abhijit')}>
          <AppText>{range(panchang.abhijit)}</AppText>
          {VARAS[panchang.vara] === 'wednesday' ? <AppText variant="caption">{t('jyotish.panchang.abhijitWednesday')}</AppText> : null}
        </Row>
        <Row label={t('jyotish.panchang.brahma')}>
          <AppText>{range(panchang.brahmaMuhurta)}</AppText>
        </Row>
      </Card>

      <Card style={styles.card}>
        <AppText variant="overline">{t('jyotish.panchang.avoidTimes')}</AppText>
        <Row label={t('jyotish.panchang.rahuKaal')}>
          <AppText>{range(panchang.rahuKaal)}</AppText>
        </Row>
        <Row label={t('jyotish.panchang.yamaganda')}>
          <AppText>{range(panchang.yamaganda)}</AppText>
        </Row>
        <Row label={t('jyotish.panchang.gulika')}>
          <AppText>{range(panchang.gulika)}</AppText>
        </Row>
      </Card>
    </View>
  );
}

function PanchangContent() {
  const { t, i18n } = useTranslation();
  const [place, setPlace] = useState<Place | null>(NEW_DELHI);
  const [now] = useState(() => Date.now());
  const [date, setDate] = useState(() => dayIn(now, NEW_DELHI.timezone));
  const [attempt, setAttempt] = useState(0);
  // Results are kept with the request they belong to, so an old answer is never shown for a new date or place.
  const key = place ? `${date}|${place.latitude},${place.longitude}|${attempt}` : '';
  const [result, setResult] = useState<{
    key: string;
    panchang: Panchang;
    sample: boolean;
  } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const data = result?.key === key ? result : null;
  const failed = failedKey === key;

  useEffect(() => {
    AsyncStorage.getItem(PLACE_KEY)
      .then((v) => {
        if (v) setPlace(JSON.parse(v) as Place);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!place) return;
    let cancelled = false;
    getPanchang(date, place)
      .then((d) => !cancelled && setResult({ key, ...d }))
      .catch(() => !cancelled && setFailedKey(key));
    return () => {
      cancelled = true;
    };
  }, [date, place, key]);

  function choosePlace(p: Place | null) {
    setPlace(p);
    if (p) AsyncStorage.setItem(PLACE_KEY, JSON.stringify(p)).catch(() => undefined);
  }

  const [y, m, d] = date.split('-').map(Number);
  const title = new Intl.DateTimeFormat(dateLocale(i18n.language), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(Date.UTC(y, m - 1, d));
  const today = dayIn(now, place?.timezone ?? NEW_DELHI.timezone);

  return (
    <Screen>
      <BackHeader title={t('jyotish.panchang.title')} />
      <View style={styles.gap}>
        <AppText variant="caption">{t('jyotish.panchang.intro')}</AppText>
        <PlaceSearch value={place} onChange={choosePlace} label={t('jyotish.panchang.place')} />
        <View style={styles.dateRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('jyotish.panchang.previousDay')}
            hitSlop={10}
            onPress={() => setDate(addDays(date, -1))}
          >
            <MaterialCommunityIcons name="chevron-left" size={30} color={colors.gold} />
          </Pressable>
          <View style={styles.dateText}>
            <AppText variant="bodyStrong" style={styles.center}>
              {title}
            </AppText>
            {date !== today ? (
              <Pressable accessibilityRole="button" onPress={() => setDate(today)}>
                <AppText variant="caption" style={[styles.center, { color: colors.gold }]}>
                  {t('jyotish.panchang.today')}
                </AppText>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('jyotish.panchang.nextDay')}
            hitSlop={10}
            onPress={() => setDate(addDays(date, 1))}
          >
            <MaterialCommunityIcons name="chevron-right" size={30} color={colors.gold} />
          </Pressable>
        </View>

        {!place ? null : failed ? (
          <View style={styles.gap}>
            <Notice text={t('jyotish.panchang.failed')} />
            <Button variant="outline" title={t('kundli.retry')} onPress={() => setAttempt((a) => a + 1)} />
          </View>
        ) : !data ? (
          <ActivityIndicator color={colors.gold} style={styles.loading} />
        ) : (
          <>
            {data.sample ? <Notice tone="info" text={t('jyotish.panchang.demoNotice')} /> : null}
            <PanchangView panchang={data.panchang} />
            <AppText variant="caption" style={styles.center}>
              {t('jyotish.panchang.timesNote', {
                place: data.sample ? NEW_DELHI.label : place.label,
              })}
            </AppText>
          </>
        )}
      </View>
    </Screen>
  );
}

/** Opens once this month is paid for (or with Premium). */
export default function PanchangScreen() {
  const { t, i18n } = useTranslation();
  const month = currentMonth();
  return (
    <PaidScreen
      title={t('jyotish.panchang.title')}
      feature="panchang"
      unlockKey={month}
      what={t('extra.paid.what.panchang', {
        period: monthLabel(month, dateLocale(i18n.language)),
      })}
    >
      <PanchangContent />
    </PaidScreen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.lg },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  loading: { marginTop: spacing.xl },
  later: { color: colors.textMuted },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateText: { flex: 1 },
  skyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skyTile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'CC',
  },
  card: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  rowLabel: { width: 104, color: colors.textFaint },
});
