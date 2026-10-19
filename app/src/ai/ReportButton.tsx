// "Report this answer": lets people flag an AI answer as harmful or wrong (Google Play's rule for AI content).
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { TextField } from '@/components/TextField';
import { isDemoMode, supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme';

export type ReportFeature = 'ask' | 'persona' | 'palm' | 'rashifal';
const REASONS = ['harmful', 'wrong', 'other'] as const;
type Reason = (typeof REASONS)[number];

async function sendReport(report: { feature: ReportFeature; itemId?: string; reason: Reason; note: string; text: string }) {
  if (isDemoMode) return;
  const { error } = await supabase.functions.invoke('report', { method: 'POST', body: report });
  if (error) throw error;
}

/** A small flag button; opens a sheet to choose why the answer is a problem. */
export function ReportButton({ feature, itemId, text }: { feature: ReportFeature; itemId?: string; text: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  function close() {
    setOpen(false);
    setReason(null);
    setNote('');
    setState('idle');
  }

  async function send() {
    if (!reason) return;
    setState('sending');
    try {
      await sendReport({ feature, itemId, reason, note: note.trim(), text });
      setState('sent');
    } catch {
      setState('failed');
    }
  }

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={t('extra.flag.title')} onPress={() => setOpen(true)} hitSlop={10}>
        <MaterialCommunityIcons name="flag-outline" size={18} color={colors.textFaint} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t('common.cancel')}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <AppText variant="heading">{t('extra.flag.title')}</AppText>
            {state === 'sent' ? (
              <>
                <Notice tone="success" text={t('extra.flag.thanks')} />
                <Button title={t('extra.flag.close')} onPress={close} />
              </>
            ) : (
              <>
                <AppText variant="caption">{t('extra.flag.intro')}</AppText>
                {REASONS.map((r) => (
                  <Pressable
                    key={r}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: reason === r }}
                    onPress={() => setReason(r)}
                    style={[styles.reason, reason === r && styles.reasonOn]}
                  >
                    <MaterialCommunityIcons
                      name={reason === r ? 'radiobox-marked' : 'radiobox-blank'}
                      size={20}
                      color={reason === r ? colors.gold : colors.textFaint}
                    />
                    <AppText style={styles.flex}>{t(`extra.flag.reasons.${r}`)}</AppText>
                  </Pressable>
                ))}
                <TextField label={t('extra.flag.note')} value={note} onChangeText={setNote} maxLength={500} multiline />
                {state === 'failed' ? <Notice text={t('extra.flag.failed')} /> : null}
                <Button title={t('extra.flag.send')} onPress={send} disabled={!reason} loading={state === 'sending'} />
                <Button variant="ghost" title={t('common.cancel')} onPress={close} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', padding: spacing.lg },
  sheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 440,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonOn: { borderColor: colors.gold },
  flex: { flex: 1 },
});
