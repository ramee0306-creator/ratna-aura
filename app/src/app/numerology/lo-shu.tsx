import { loShuGrid } from '@ratna/numerology';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Card } from '@/components/Card';
import { Checkbox } from '@/components/Checkbox';
import { Screen } from '@/components/Screen';
import { LoShuGridView } from '@/numerology/LoShuGridView';
import { NumberBadge } from '@/numerology/NumberBadge';
import { RequireDetails } from '@/numerology/RequireDetails';
import { colors, spacing } from '@/theme';
import { PaidGate } from '@/paid/PaidGate';

export default function LoShuScreen() {
  const { t } = useTranslation();
  const [withKua, setWithKua] = useState(false);

  return (
    <Screen>
      <BackHeader title={t('numerology.loShu.title')} />
      <RequireDetails>
        {(me, birth) => {
          const grid = loShuGrid(birth, {
            gender: withKua && me.gender ? me.gender : undefined,
          });
          return (
            <PaidGate feature="loshu" unlockKey={`${me.fullName}|${me.birthDate}`} what={t('extra.paid.what.loshu')}>
              <>
                <AppText variant="caption">{t('numerology.loShu.intro')}</AppText>
                <LoShuGridView counts={grid.counts} />
                {me.gender ? (
                  <Checkbox checked={withKua} onChange={setWithKua} label={t('numerology.loShu.includeKua')} />
                ) : (
                  <AppText variant="caption">{t('numerology.loShu.kuaNeedsGender')}</AppText>
                )}
                {grid.kua !== null ? <AppText variant="bodyStrong">{t('numerology.loShu.kua', { kua: grid.kua })}</AppText> : null}

                <AppText variant="overline" style={styles.section}>
                  {t('numerology.loShu.missing')}
                </AppText>
                {grid.missing.length === 0 ? (
                  <AppText>{t('numerology.loShu.noneMissing')}</AppText>
                ) : (
                  grid.missing.map((n) => (
                    <Card key={n} style={styles.item}>
                      <NumberBadge value={n} size={44} />
                      <View style={styles.itemText}>
                        <AppText>{t(`numerology.loShu.missingNumbers.m${n}.body`)}</AppText>
                        <AppText variant="caption" style={{ color: colors.emeraldBright }}>
                          {t('numerology.loShu.tip', {
                            tip: t(`numerology.loShu.missingNumbers.m${n}.tip`),
                          })}
                        </AppText>
                      </View>
                    </Card>
                  ))
                )}

                {grid.repeated.length > 0 ? (
                  <>
                    <AppText variant="overline" style={styles.section}>
                      {t('numerology.loShu.strong')}
                    </AppText>
                    <Card style={styles.list}>
                      {grid.repeated.map((r) => (
                        <AppText key={r.number} variant="bodyStrong">
                          {t('numerology.loShu.strongLine', {
                            number: r.number,
                            count: r.count,
                          })}
                        </AppText>
                      ))}
                      <AppText variant="caption">{t('numerology.loShu.strongBody')}</AppText>
                    </Card>
                  </>
                ) : null}

                <AppText variant="overline" style={styles.section}>
                  {t('numerology.loShu.completeLines')}
                </AppText>
                <Card style={styles.list}>
                  {grid.completePlanes.length === 0 ? (
                    <AppText variant="caption">{t('numerology.loShu.noCompleteLines')}</AppText>
                  ) : (
                    grid.completePlanes.map((p) => (
                      <View key={p}>
                        <AppText variant="bodyStrong" style={{ color: colors.emeraldBright }}>
                          {t(`numerology.loShu.lines.${p}.name`)}
                        </AppText>
                        <AppText variant="caption">{t(`numerology.loShu.lines.${p}.body`)}</AppText>
                      </View>
                    ))
                  )}
                </Card>

                {grid.emptyPlanes.length > 0 ? (
                  <>
                    <AppText variant="overline" style={styles.section}>
                      {t('numerology.loShu.emptyLines')}
                    </AppText>
                    <Card style={styles.list}>
                      {grid.emptyPlanes.map((p) => (
                        <View key={p}>
                          <AppText variant="bodyStrong">{t(`numerology.loShu.lines.${p}.name`)}</AppText>
                          <AppText variant="caption">{t(`numerology.loShu.lines.${p}.body`)}</AppText>
                        </View>
                      ))}
                      <AppText variant="caption">{t('numerology.loShu.emptyBody')}</AppText>
                    </Card>
                  </>
                ) : null}
              </>
            </PaidGate>
          );
        }}
      </RequireDetails>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg, color: colors.emeraldBright },
  item: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  itemText: { flex: 1, gap: spacing.xs },
  list: { gap: spacing.md },
});
