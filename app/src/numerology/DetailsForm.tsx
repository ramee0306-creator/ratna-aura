import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { Segmented } from '@/components/Segmented';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/theme';

import { type DetailsError, formatDateInput, type Gender, isoToDisplay, type PersonDetails, validateDetails } from './details';

type Props = {
  initial?: PersonDetails | null;
  onSave: (details: PersonDetails) => void | Promise<void>;
  askGender?: boolean;
  saveLabel?: string;
  nameLabel?: string;
  namePlaceholder?: string;
};

/** Name + date of birth (+ optional gender) with friendly checks. */
export function DetailsForm({ initial, onSave, askGender = true, saveLabel, nameLabel, namePlaceholder }: Props) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [dateText, setDateText] = useState(initial ? isoToDisplay(initial.birthDate) : '');
  const [gender, setGender] = useState<Gender | 'skip'>(initial?.gender ?? 'skip');
  const [errors, setErrors] = useState<Partial<Record<'name' | 'date', DetailsError>>>({});
  const [busy, setBusy] = useState(false);

  async function save() {
    const result = validateDetails({ fullName, dateText, gender: gender === 'skip' ? null : gender });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await onSave(result.value);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <TextField
          label={nameLabel ?? t('numerology.details.nameLabel')}
          placeholder={namePlaceholder ?? t('numerology.details.namePlaceholder')}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoComplete="name"
          autoCorrect={false}
        />
        {errors.name ? <Notice text={t(`numerology.details.${errors.name}`)} /> : null}
        {!nameLabel ? <AppText variant="caption">{t('numerology.details.nameHint')}</AppText> : null}
      </View>

      <View style={styles.field}>
        <TextField
          label={t('numerology.details.dobLabel')}
          placeholder={t('numerology.details.dobPlaceholder')}
          value={dateText}
          onChangeText={(text) => setDateText(formatDateInput(text))}
          keyboardType="number-pad"
          maxLength={10}
        />
        {errors.date ? <Notice text={t(`numerology.details.${errors.date}`)} /> : null}
      </View>

      {askGender ? (
        <View style={styles.field}>
          <AppText variant="label">{t('numerology.details.genderLabel')}</AppText>
          <Segmented
            accent={colors.emerald}
            value={gender}
            onChange={setGender}
            label={t('numerology.details.genderLabel')}
            options={[
              { value: 'female', label: t('numerology.details.female') },
              { value: 'male', label: t('numerology.details.male') },
              { value: 'skip', label: t('numerology.details.skip') },
            ]}
          />
        </View>
      ) : null}

      <Button title={saveLabel ?? t('numerology.details.save')} onPress={save} loading={busy} />
      <AppText variant="caption" style={styles.center}>
        {t('numerology.details.savedPrivately')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  field: { gap: spacing.xs },
  center: { textAlign: 'center' },
});
