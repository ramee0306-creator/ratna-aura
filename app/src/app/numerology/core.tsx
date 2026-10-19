import { coreNumbers, luckyFactors, type NumerologySystem, personalCycles } from '@ratna/numerology';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { todayDate } from '@/numerology/details';
import { NumberBadge } from '@/numerology/NumberBadge';
import { NumberCard } from '@/numerology/NumberCard';
import { useNumerology } from '@/numerology/NumerologyProvider';
import { RequireDetails } from '@/numerology/RequireDetails';
import { colors, spacing } from '@/theme';
import { PaidGate } from '@/paid/PaidGate';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="label" style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText style={styles.rowValue}>{value}</AppText>
    </View>
  );
}

export default function CoreNumbersScreen() {
  const { t } = useTranslation();
  const { system, setSystem } = useNumerology();

  return (
    <Screen>
      <BackHeader title={t('numerology.core.title')} />
      <RequireDetails>
        {(me, birth) => {
          const n = coreNumbers(me.fullName, birth, system);
          const cycles = personalCycles(birth, todayDate());
          const lucky = luckyFactors(n);
          const list = (items: string[]) => (items.length ? items.join(', ') : t('numerology.core.none'));
          return (
            <PaidGate feature="numbers" unlockKey={`${me.fullName}|${me.birthDate}`} what={t('extra.paid.what.numbers')}>
              <>
                <View style={styles.system}>
                  <AppText variant="label">{t('numerology.system.label')}</AppText>
                  <Segmented<NumerologySystem>
                    accent={colors.emerald}
                    value={system}
                    onChange={setSystem}
                    options={[
                      {
                        value: 'chaldean',
                        label: t('numerology.system.chaldean'),
                      },
                      {
                        value: 'pythagorean',
                        label: t('numerology.system.pythagorean'),
                      },
                    ]}
                  />
                  <AppText variant="caption">{t(`numerology.system.${system}Hint`)}</AppText>
                </View>

                <NumberCard label={t('numerology.core.mulank')} about={t('numerology.core.mulankAbout')} value={n.mulank} />
                <NumberCard label={t('numerology.core.bhagyank')} about={t('numerology.core.bhagyankAbout')} value={n.bhagyank} />
                {system === 'pythagorean' && n.lifePath !== n.bhagyank ? (
                  <NumberCard label={t('numerology.core.lifePath')} about={t('numerology.core.lifePathAbout')} value={n.lifePath} />
                ) : null}
                <NumberCard
                  label={t('numerology.core.name')}
                  about={t('numerology.core.nameAbout', {
                    compound: n.name.compound,
                  })}
                  value={n.name.number}
                />
                <NumberCard label={t('numerology.core.soulUrge')} about={t('numerology.core.soulUrgeAbout')} value={n.soulUrge.number} />
                <NumberCard
                  label={t('numerology.core.personality')}
                  about={t('numerology.core.personalityAbout')}
                  value={n.personality.number}
                />
                <NumberCard label={t('numerology.core.maturity')} about={t('numerology.core.maturityAbout')} value={n.maturity} />

                <AppText variant="overline" style={styles.section}>
                  {t('numerology.core.cycles')}
                </AppText>
                <Card style={styles.cycles}>
                  {(['personalYear', 'personalMonth', 'personalDay'] as const).map((key, i) => (
                    <View key={key} style={styles.cycle}>
                      <NumberBadge value={[cycles.year, cycles.month, cycles.day][i]} size={52} tone="gold" />
                      <AppText variant="label">{t(`numerology.core.${key}`)}</AppText>
                    </View>
                  ))}
                </Card>
                <AppText variant="caption">{t(`numerology.years.y${cycles.year}`)}</AppText>

                <AppText variant="overline" style={styles.section}>
                  {t('numerology.core.lucky')}
                </AppText>
                <Card style={styles.lucky}>
                  <AppText variant="bodyStrong">
                    {t('numerology.core.planetLine', {
                      planet: t(`numerology.planets.${lucky.planet}`),
                    })}
                  </AppText>
                  <Row label={t('numerology.core.luckyNumbers')} value={list(lucky.numbers.map(String))} />
                  <Row label={t('numerology.core.avoidNumbers')} value={list(lucky.avoid.map(String))} />
                  <Row label={t('numerology.core.luckyDays')} value={list(lucky.days.map((d) => t(`numerology.days.${d}`)))} />
                  <Row label={t('numerology.core.luckyColours')} value={list(lucky.colours.map((c) => t(`numerology.colours.${c}`)))} />
                  <Row label={t('numerology.core.gem')} value={t(`numerology.gems.${lucky.gem}`)} />
                  <AppText variant="caption">{t('numerology.core.gemNote')}</AppText>
                </Card>
              </>
            </PaidGate>
          );
        }}
      </RequireDetails>
    </Screen>
  );
}

const styles = StyleSheet.create({
  system: { gap: spacing.sm },
  section: { marginTop: spacing.lg, color: colors.emeraldBright },
  cycles: { flexDirection: 'row', justifyContent: 'space-around' },
  cycle: { alignItems: 'center', gap: spacing.xs },
  lucky: { gap: spacing.md },
  row: { gap: 2 },
  rowLabel: { color: colors.textFaint },
  rowValue: {},
});
