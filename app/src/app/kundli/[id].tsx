import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BODIES,
  type ChartKind,
  chartBoxes,
  currentDasha,
  formatDegrees,
  type Kundli,
  type Mahadasha,
  NAKSHATRAS,
  SIGNS,
} from '@ratna/kundli';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { brand } from '@brand';

import { dateLocale } from '@/i18n';
import { type BirthProfile, deleteProfile, getKundli } from '@/kundli/api';
import { type ChartStyle, KundliChart } from '@/kundli/KundliChart';
import { isoToDisplay } from '@/numerology/details';
import { kundliReportHtml } from '@/reports/kundliReport';
import { sharePdf } from '@/reports/sharePdf';
import { colors, spacing } from '@/theme';
import { PaidScreen } from '@/paid/PaidGate';
import { showDemoNotices } from '@/lib/supabase';

type Tab = 'chart' | 'planets' | 'dasha' | 'details';
const STYLE_KEY = 'kundli.chartStyle';

function useDateFormat() {
  const { i18n } = useTranslation();
  const format = new Intl.DateTimeFormat(dateLocale(i18n.language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (ms: number) => format.format(new Date(ms));
}

function ChartTab({ kundli }: { kundli: Kundli }) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ChartKind>(kundli.timeKnown ? 'lagna' : 'moon');
  const [style, setStyle] = useState<ChartStyle>('north');

  useEffect(() => {
    AsyncStorage.getItem(STYLE_KEY).then((v) => {
      if (v === 'north' || v === 'south') setStyle(v);
    });
  }, []);

  const title = t(`kundli.chart.${kind}`);
  return (
    <View style={styles.gap}>
      <Segmented<ChartKind>
        value={kind}
        onChange={setKind}
        options={(['lagna', 'navamsa', 'moon'] as const).map((k) => ({
          value: k,
          label: t(`kundli.chart.${k}`),
        }))}
      />
      <KundliChart boxes={chartBoxes(kundli, kind)} style={style} title={title} />
      <Segmented<ChartStyle>
        value={style}
        onChange={(s) => {
          setStyle(s);
          AsyncStorage.setItem(STYLE_KEY, s).catch(() => undefined);
        }}
        options={(['north', 'south'] as const).map((s) => ({
          value: s,
          label: t(`kundli.chart.${s}`),
        }))}
      />
      <AppText variant="caption">{t(style === 'north' ? 'kundli.chart.legend' : 'kundli.chart.legendSouth')}</AppText>
    </View>
  );
}

function PlanetsTab({ kundli }: { kundli: Kundli }) {
  const { t } = useTranslation();
  const rows = [
    {
      key: 'asc',
      name: t('kundli.details.lagna'),
      point: kundli.ascendant,
      house: 1,
      tags: [] as string[],
    },
    ...BODIES.map((body) => {
      const p = kundli.planets.find((x) => x.body === body)!;
      return {
        key: body,
        name: t(`kundli.bodies.${body}`),
        point: p,
        house: p.house,
        tags: [
          ...(p.retrograde ? [t('kundli.planetsTable.retrograde')] : []),
          ...(p.dignity ? [t(`kundli.planetsTable.${p.dignity}`)] : []),
        ],
      };
    }),
  ];
  return (
    <View style={styles.gapSm}>
      {rows.map((row) => (
        <Card key={row.key} style={styles.planetRow}>
          <View style={styles.planetTop}>
            <AppText variant="bodyStrong" style={styles.flex}>
              {row.name}
            </AppText>
            <AppText variant="label">
              {t('kundli.planetsTable.house')} {row.house}
            </AppText>
          </View>
          <AppText>
            {t(`kundli.signs.${SIGNS[row.point.sign]}`)} · {formatDegrees(row.point.degreeInSign)}
          </AppText>
          <AppText variant="caption">
            {t(`kundli.nakshatras.${NAKSHATRAS[row.point.nakshatra]}`)}, {t('kundli.details.pada', { pada: row.point.pada })}
          </AppText>
          {row.tags.length ? (
            <AppText variant="caption" style={{ color: colors.emeraldBright }}>
              {row.tags.join(' · ')}
            </AppText>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

function DashaTab({ dashas }: { dashas: Mahadasha[] }) {
  const { t } = useTranslation();
  const date = useDateFormat();
  const [now] = useState(() => Date.now());
  const running = currentDasha(dashas, now);
  const [open, setOpen] = useState<number | null>(dashas.findIndex((d) => d.start <= now && now < d.end));

  return (
    <View style={styles.gapSm}>
      <AppText variant="caption">{t('kundli.dasha.intro')}</AppText>
      {running ? (
        <Card style={[styles.gapXs, { borderColor: colors.gold }]}>
          <AppText variant="overline">{t('kundli.dasha.current')}</AppText>
          <AppText variant="heading">
            {t(`kundli.bodies.${running.mahadasha}`)} – {t(`kundli.bodies.${running.antardasha}`)}
          </AppText>
        </Card>
      ) : null}
      {dashas.map((md, i) => {
        const isNow = md.start <= now && now < md.end;
        return (
          <Card key={md.lord + md.start} style={isNow ? [styles.gapXs, { borderColor: colors.emerald }] : styles.gapXs}>
            <Pressable accessibilityRole="button" onPress={() => setOpen(open === i ? null : i)} style={styles.dashaHead}>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">
                  {t('kundli.dasha.mahadasha', {
                    planet: t(`kundli.bodies.${md.lord}`),
                  })}
                </AppText>
                <AppText variant="caption">
                  {t('kundli.dasha.range', {
                    from: date(md.start),
                    to: date(md.end),
                  })}
                </AppText>
              </View>
              <AppText variant="label" style={{ color: colors.gold }}>
                {open === i ? '−' : '+'}
              </AppText>
            </Pressable>
            {open === i
              ? md.antardashas.map((ad) => {
                  const adNow = ad.start <= now && now < ad.end;
                  return (
                    <View key={ad.lord + ad.start} style={styles.adRow}>
                      <AppText style={[styles.flex, adNow && { color: colors.emeraldBright }]}>
                        {t(`kundli.bodies.${md.lord}`)} – {t(`kundli.bodies.${ad.lord}`)}
                      </AppText>
                      <AppText variant="caption">{t('kundli.dasha.until', { date: date(ad.end) })}</AppText>
                    </View>
                  );
                })
              : null}
          </Card>
        );
      })}
    </View>
  );
}

function PdfButton({ kundli, profile }: { kundli: Kundli; profile: BirthProfile }) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function make() {
    setBusy(true);
    setFailed(false);
    try {
      const html = kundliReportHtml({
        person: profile,
        kundli,
        t,
        dateLocale: dateLocale(i18n.language),
        now: Date.now(),
        appName: brand.appName,
      });
      await sharePdf(html, `${profile.fullName} – ${t('kundli.title')}`);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {failed ? <Notice text={t('extra.report.failed')} /> : null}
      <Button variant="outline" title={busy ? t('extra.report.preparing') : t('extra.report.download')} onPress={make} loading={busy} />
    </>
  );
}

function DetailsTab({ kundli, profile }: { kundli: Kundli; profile: BirthProfile }) {
  const { t } = useTranslation();
  const moon = kundli.planets.find((p) => p.body === 'moon')!;
  const sun = kundli.planets.find((p) => p.body === 'sun')!;
  const rows: [string, string][] = [
    [t('kundli.details.born'), `${isoToDisplay(profile.birthDate)}${profile.birthTime ? `, ${profile.birthTime}` : ''}`],
    [t('kundli.details.place'), profile.birthPlace.name],
    [t('kundli.details.lagna'), `${t(`kundli.signs.${SIGNS[kundli.ascendant.sign]}`)} ${formatDegrees(kundli.ascendant.degreeInSign)}`],
    [t('kundli.details.rashi'), t(`kundli.signs.${SIGNS[moon.sign]}`)],
    [
      t('kundli.details.nakshatra'),
      `${t(`kundli.nakshatras.${NAKSHATRAS[moon.nakshatra]}`)}, ${t('kundli.details.pada', { pada: moon.pada })}`,
    ],
    [t('kundli.details.sunSign'), t(`kundli.signs.${SIGNS[sun.sign]}`)],
    [t('kundli.details.ayanamsa'), formatDegrees(kundli.ayanamsa)],
    [t('kundli.details.engine'), kundli.engine],
  ];
  return (
    <Card style={styles.gapMd}>
      {rows.map(([label, value]) => (
        <View key={label}>
          <AppText variant="label" style={{ color: colors.textFaint }}>
            {label}
          </AppText>
          <AppText>{value}</AppText>
        </View>
      ))}
    </Card>
  );
}

function KundliScreenContent() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<{
    profile: BirthProfile;
    kundli: Kundli;
    sample: boolean;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState<Tab>('chart');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getKundli(id)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  async function remove() {
    setBusy(true);
    try {
      await deleteProfile(id);
      router.back();
    } catch {
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <Screen>
      <BackHeader title={data?.profile.fullName ?? t('kundli.title')} />
      {failed ? (
        <View style={styles.gap}>
          <Notice text={t('kundli.loadFailed')} />
          <Button
            variant="outline"
            title={t('kundli.retry')}
            onPress={() => {
              setFailed(false);
              setAttempt((a) => a + 1);
            }}
          />
        </View>
      ) : !data ? (
        <ActivityIndicator color={colors.gold} style={styles.loading} />
      ) : (
        <View style={styles.gap}>
          {data.sample && showDemoNotices ? <Notice tone="info" text={t('kundli.demoNotice')} /> : null}
          {!data.kundli.timeKnown ? <Notice tone="info" text={t('kundli.details.timeUnknown')} /> : null}
          <Segmented<Tab>
            accent={colors.gold}
            value={tab}
            onChange={setTab}
            options={(['chart', 'planets', 'dasha', 'details'] as const).map((k) => ({ value: k, label: t(`kundli.tabs.${k}`) }))}
          />
          {tab === 'chart' ? <ChartTab kundli={data.kundli} /> : null}
          {tab === 'planets' ? <PlanetsTab kundli={data.kundli} /> : null}
          {tab === 'dasha' ? <DashaTab dashas={data.kundli.dashas} /> : null}
          {tab === 'details' ? (
            <>
              <DetailsTab kundli={data.kundli} profile={data.profile} />
              <PdfButton kundli={data.kundli} profile={data.profile} />
              {!confirmDelete ? (
                <Button variant="danger" title={t('kundli.delete')} onPress={() => setConfirmDelete(true)} />
              ) : (
                <Card style={styles.gapMd}>
                  <AppText>{t('kundli.deleteConfirm', { name: data.profile.fullName })}</AppText>
                  <Button variant="danger" title={t('kundli.deleteYes')} onPress={remove} loading={busy} />
                  <Button variant="ghost" title={t('common.cancel')} onPress={() => setConfirmDelete(false)} />
                </Card>
              )}
            </>
          ) : null}
          <AppText variant="caption" style={styles.center}>
            {t('numerology.guidance')}
          </AppText>
        </View>
      )}
    </Screen>
  );
}

/** The kundli opens once it is paid for (one payment per person, or Premium). */
export default function KundliScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PaidScreen title={t('kundli.title')} feature="kundli" unlockKey={id} what={t('extra.paid.what.kundli')}>
      <KundliScreenContent />
    </PaidScreen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  gap: { gap: spacing.lg },
  gapMd: { gap: spacing.md },
  gapSm: { gap: spacing.sm },
  gapXs: { gap: spacing.xs },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  planetRow: { gap: 2, paddingVertical: spacing.md },
  planetTop: { flexDirection: 'row', alignItems: 'center' },
  dashaHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  adRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 2,
  },
});
