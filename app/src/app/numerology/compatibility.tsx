import { bhagyank, compatibility, mulank, parseIsoDate } from '@ratna/numerology';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { DetailsForm } from '@/numerology/DetailsForm';
import { NumberBadge } from '@/numerology/NumberBadge';
import { useNumerology } from '@/numerology/NumerologyProvider';
import { RequireDetails } from '@/numerology/RequireDetails';
import { colors, radius, spacing } from '@/theme';
import { PaidGate } from '@/paid/PaidGate';

type Relation = 'love' | 'marriage' | 'business' | 'friendship';

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <View style={styles.bar}>
      <View style={styles.barLabel}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="label">
          {value}/{max}
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(value / max) * 100}%` }]} />
      </View>
    </View>
  );
}

export default function CompatibilityScreen() {
  const { t } = useTranslation();
  const { partner, savePartner } = useNumerology();
  const [relation, setRelation] = useState<Relation>('love');
  const [editing, setEditing] = useState(false);
  const partnerBirth = partner ? parseIsoDate(partner.birthDate) : null;

  return (
    <Screen>
      <BackHeader title={t('numerology.compatibility.title')} />
      <RequireDetails>
        {(me, birth) => {
          const mine = { mulank: mulank(birth), bhagyank: bhagyank(birth) };
          const theirs = partnerBirth ? { mulank: mulank(partnerBirth), bhagyank: bhagyank(partnerBirth) } : null;
          const result = theirs ? compatibility(mine, theirs) : null;
          return (
            <>
              <AppText variant="caption">{t('numerology.compatibility.intro')}</AppText>
              <View style={styles.gapSm}>
                <AppText variant="label">{t('numerology.compatibility.relation')}</AppText>
                <Segmented<Relation>
                  accent={colors.emerald}
                  value={relation}
                  onChange={setRelation}
                  options={(['love', 'marriage', 'business', 'friendship'] as const).map((r) => ({
                    value: r,
                    label: t(`numerology.compatibility.${r}`),
                  }))}
                />
              </View>

              {!result || !partner || editing ? (
                <Card style={styles.gapLg}>
                  <AppText variant="heading">{t('numerology.details.partnerTitle')}</AppText>
                  <DetailsForm
                    initial={partner}
                    askGender={false}
                    nameLabel={t('numerology.compatibility.partnerName')}
                    namePlaceholder={t('numerology.compatibility.partnerNamePlaceholder')}
                    saveLabel={t('numerology.compatibility.check')}
                    onSave={async (details) => {
                      await savePartner(details);
                      setEditing(false);
                    }}
                  />
                </Card>
              ) : (
                <>
                  <PaidGate
                    feature="compatibility"
                    unlockKey={`${me.fullName}|${me.birthDate}|${partner.fullName}|${partner.birthDate}`}
                    what={t('extra.paid.what.compatibility', {
                      name: partner.fullName,
                    })}
                  >
                    <Card style={styles.gapLg}>
                      <AppText variant="overline" style={{ color: colors.emeraldBright }}>
                        {t(`numerology.compatibility.${relation}`)}
                      </AppText>
                      <View style={styles.people}>
                        <View style={styles.personCol}>
                          <View style={styles.pair}>
                            <NumberBadge value={mine.mulank} size={44} />
                            <NumberBadge value={mine.bhagyank} size={44} tone="gold" />
                          </View>
                          <AppText variant="label" numberOfLines={1}>
                            {me.fullName.split(' ')[0]}
                          </AppText>
                        </View>
                        <AppText variant="display" style={styles.score}>
                          {result.score}%
                        </AppText>
                        <View style={styles.personCol}>
                          <View style={styles.pair}>
                            <NumberBadge value={theirs!.mulank} size={44} />
                            <NumberBadge value={theirs!.bhagyank} size={44} tone="gold" />
                          </View>
                          <AppText variant="label" numberOfLines={1}>
                            {partner.fullName.split(' ')[0]}
                          </AppText>
                        </View>
                      </View>
                      <AppText variant="heading" style={styles.center}>
                        {t(`numerology.compatibility.levels.${result.level}.title`)}
                      </AppText>
                      <AppText style={styles.center}>{t(`numerology.compatibility.levels.${result.level}.body`)}</AppText>
                    </Card>

                    <Card style={styles.gapMd}>
                      <AppText variant="overline" style={{ color: colors.emeraldBright }}>
                        {t('numerology.compatibility.parts')}
                      </AppText>
                      <Bar label={t('numerology.compatibility.partMulank')} value={result.parts.mulank} max={4} />
                      <Bar label={t('numerology.compatibility.partBhagyank')} value={result.parts.bhagyank} max={4} />
                      <Bar label={t('numerology.compatibility.partCross')} value={result.parts.cross} max={8} />
                    </Card>
                  </PaidGate>

                  <Button variant="outline" title={t('numerology.compatibility.change')} onPress={() => setEditing(true)} />
                </>
              )}
              <AppText variant="caption">{t('numerology.compatibility.note')}</AppText>
            </>
          );
        }}
      </RequireDetails>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gapSm: { gap: spacing.sm },
  gapMd: { gap: spacing.md },
  gapLg: { gap: spacing.lg },
  people: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personCol: { alignItems: 'center', gap: spacing.xs, width: 104 },
  pair: { flexDirection: 'row', gap: spacing.xs },
  score: { fontSize: 44, lineHeight: 52, fontVariant: ['lining-nums'] },
  center: { textAlign: 'center' },
  bar: { gap: spacing.xs },
  barLabel: { flexDirection: 'row', justifyContent: 'space-between' },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundDeep,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.emerald,
  },
});
