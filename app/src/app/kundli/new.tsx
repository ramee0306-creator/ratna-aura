import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { TextField } from '@/components/TextField';
import { ApiError, createProfile, type Gender, RELATIONS, type Relation } from '@/kundli/api';
import { formatTimeInput, type KundliFormError, validateKundliForm } from '@/kundli/form';
import { formatDateInput } from '@/numerology/details';
import { PlaceSearch } from '@/places/PlaceSearch';
import type { Place } from '@/places/search';
import { spacing } from '@/theme';

export default function NewKundliScreen() {
  const { t } = useTranslation();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [relation, setRelation] = useState<Relation>(first === '1' ? 'self' : 'spouse');
  const [dateText, setDateText] = useState('');
  const [timeText, setTimeText] = useState('');
  const [meridiem, setMeridiem] = useState<'am' | 'pm'>('am');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [errors, setErrors] = useState<KundliFormError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const error = (field: KundliFormError) => (errors.includes(field) ? <Notice text={t(`kundli.form.errors.${field}`)} /> : null);
  /** Wraps a setter so that editing a field hides its old error message. */
  const edit =
    <T,>(field: KundliFormError, set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setErrors((prev) => prev.filter((e) => e !== field));
    };

  async function save() {
    const result = validateKundliForm({
      fullName,
      gender,
      relation,
      dateText,
      timeText,
      meridiem,
      timeUnknown,
      place,
      isPrimary: relation === 'self',
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setServerError(null);
    setBusy(true);
    try {
      const profile = await createProfile(result.value);
      router.replace({ pathname: '/kundli/[id]', params: { id: profile.id } });
    } catch (err) {
      setServerError(t(err instanceof ApiError && err.status === 409 ? 'kundli.form.errors.limit' : 'kundli.form.errors.server'));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackHeader title={t('kundli.form.title')} />
      <View style={styles.form}>
        <View style={styles.field}>
          <TextField
            label={t('kundli.form.name')}
            placeholder={t('kundli.form.namePlaceholder')}
            value={fullName}
            onChangeText={edit('name', setFullName)}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {error('name')}
        </View>

        <View style={styles.field}>
          <AppText variant="label">{t('kundli.form.relation')}</AppText>
          <Segmented<Relation>
            value={relation}
            onChange={setRelation}
            options={RELATIONS.map((r) => ({ value: r, label: t(`kundli.relations.${r}`) }))}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="label">{t('kundli.form.gender')}</AppText>
          <Segmented<Gender>
            value={gender}
            onChange={edit('gender', setGender)}
            options={(['female', 'male', 'other'] as const).map((g) => ({ value: g, label: t(`kundli.form.${g}`) }))}
          />
          {error('gender')}
        </View>

        <View style={styles.field}>
          <TextField
            label={t('kundli.form.date')}
            placeholder={t('numerology.details.dobPlaceholder')}
            value={dateText}
            onChangeText={edit('date', (v: string) => setDateText(formatDateInput(v)))}
            keyboardType="number-pad"
            maxLength={10}
          />
          {error('date')}
        </View>

        <View style={styles.field}>
          {!timeUnknown ? (
            <>
              <TextField
                label={t('kundli.form.time')}
                placeholder={t('kundli.form.timePlaceholder')}
                value={timeText}
                onChangeText={edit('time', (v: string) => setTimeText(formatTimeInput(v)))}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Segmented<'am' | 'pm'>
                value={meridiem}
                onChange={edit('time', setMeridiem)}
                options={[
                  { value: 'am', label: t('kundli.form.am') },
                  { value: 'pm', label: t('kundli.form.pm') },
                ]}
              />
              {error('time')}
            </>
          ) : null}
          <Checkbox checked={timeUnknown} onChange={edit('time', setTimeUnknown)} label={t('kundli.form.timeUnknown')} />
          {timeUnknown ? <AppText variant="caption">{t('kundli.form.timeUnknownHint')}</AppText> : null}
        </View>

        <View style={styles.field}>
          <PlaceSearch value={place} onChange={edit('place', setPlace)} />
          {error('place')}
        </View>

        {serverError ? <Notice text={serverError} /> : null}
        <Button title={t('kundli.form.save')} onPress={save} loading={busy} />
        <AppText variant="caption" style={styles.center}>
          {t('kundli.form.savedSecurely')}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl },
  field: { gap: spacing.sm },
  center: { textAlign: 'center' },
});
