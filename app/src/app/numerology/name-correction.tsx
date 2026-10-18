import { bhagyank, harmony, isLatinName, mulank, nameNumber, suggestNameSpellings } from '@ratna/numerology';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { HarmonyPill } from '@/numerology/HarmonyPill';
import { NumberBadge } from '@/numerology/NumberBadge';
import { RequireDetails } from '@/numerology/RequireDetails';
import { colors, spacing } from '@/theme';

function NameResult({ spelling, compound, number, harmony: h, caption }: {
  spelling: string;
  compound: number;
  number: number;
  harmony: ReturnType<typeof harmony>;
  caption?: string;
}) {
  return (
    <Card style={styles.result}>
      <NumberBadge value={number} size={48} />
      <View style={styles.resultText}>
        <AppText variant="bodyStrong">{spelling}</AppText>
        <AppText variant="caption">
          {compound} → {number}
          {caption ? `  ·  ${caption}` : ''}
        </AppText>
        <HarmonyPill harmony={h} />
      </View>
    </Card>
  );
}

export default function NameCorrectionScreen() {
  const { t } = useTranslation();
  const [other, setOther] = useState('');
  const [checked, setChecked] = useState<string | null>(null);
  const [error, setError] = useState(false);

  return (
    <Screen>
      <BackHeader title={t('numerology.nameCorrection.title')} />
      <RequireDetails>
        {(me, birth) => {
          const person = { mulank: mulank(birth), bhagyank: bhagyank(birth) };
          const { current, suggestions } = suggestNameSpellings(me.fullName, person);
          const checkedNumber = checked ? nameNumber(checked, 'chaldean') : null;
          return (
            <>
              <AppText variant="caption">{t('numerology.nameCorrection.intro')}</AppText>

              <AppText variant="overline" style={styles.section}>
                {t('numerology.nameCorrection.current')}
              </AppText>
              <NameResult {...current} />
              <AppText variant="caption">{t('numerology.harmony.basis', person)}</AppText>

              <AppText variant="overline" style={styles.section}>
                {t('numerology.nameCorrection.suggestions')}
              </AppText>
              {suggestions.length === 0 ? (
                <Notice
                  tone="success"
                  text={t(
                    current.harmony === 'supportive' ? 'numerology.nameCorrection.alreadyBest' : 'numerology.nameCorrection.noneFound',
                  )}
                />
              ) : (
                suggestions.map((s) => (
                  <NameResult
                    key={s.spelling}
                    {...s}
                    caption={t('numerology.nameCorrection.changes', { count: s.changes })}
                  />
                ))
              )}

              <AppText variant="overline" style={styles.section}>
                {t('numerology.nameCorrection.tryAnother')}
              </AppText>
              <TextField
                label={t('numerology.details.nameLabel')}
                placeholder={me.fullName}
                value={other}
                onChangeText={setOther}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {error ? <Notice text={t('numerology.details.invalidName')} /> : null}
              <Button
                variant="outline"
                title={t('numerology.nameCorrection.check')}
                onPress={() => {
                  const ok = isLatinName(other);
                  setError(!ok);
                  setChecked(ok ? other.trim().replace(/\s+/g, ' ') : null);
                }}
              />
              {checked && checkedNumber ? (
                <NameResult
                  spelling={checked}
                  compound={checkedNumber.compound}
                  number={checkedNumber.number}
                  harmony={harmony(checkedNumber.number, person)}
                />
              ) : null}

              <AppText variant="caption" style={styles.note}>
                {t('numerology.nameCorrection.note')}
              </AppText>
            </>
          );
        }}
      </RequireDetails>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg, color: colors.emeraldBright },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  resultText: { flex: 1, gap: 2 },
  note: { marginTop: spacing.md },
});
