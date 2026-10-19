// Pieces shared by the "Ask AI" and persona chats: message bubbles, the helpline card, the person picker.
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import type { ChatMessage } from '@/ai/api';
import { AIBadge } from '@/components/AIBadge';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import type { BirthProfile } from '@/kundli/api';
import { colors, fonts, radius, spacing } from '@/theme';

export const MAX_MESSAGE = 1000;

export function Helpline() {
  const { t } = useTranslation();
  return (
    <Card style={[styles.gapSm, { borderColor: colors.emerald }]}>
      <AppText variant="bodyStrong">{t('ai.ask.helplineTitle')}</AppText>
      <AppText>{t('ai.ask.helpline')}</AppText>
      <Button variant="outline" title={t('ai.ask.callHelpline')} onPress={() => Linking.openURL('tel:14416')} />
    </Card>
  );
}

export function Bubble({ message, aiName }: { message: ChatMessage; aiName?: string }) {
  const { t } = useTranslation();
  const mine = message.role === 'user';
  return (
    <View style={styles.gapSm}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        {!mine ? (
          <View style={styles.aiHead}>
            <AppText variant="label" style={{ color: colors.gold }}>
              {aiName ?? t('ai.ask.aiName')}
            </AppText>
            <AIBadge />
          </View>
        ) : null}
        <AppText selectable>{message.text}</AppText>
      </View>
      {message.distress ? <Helpline /> : null}
    </View>
  );
}

export function PersonChips({ people, value, onChange }: { people: BirthProfile[]; value: string | null; onChange: (id: string | null) => void }) {
  const { t } = useTranslation();
  const options = [...people.map((p) => ({ id: p.id as string | null, label: p.fullName })), { id: null, label: t('ai.ask.general') }];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel={t('ai.ask.aboutWhom')}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id ?? 'general'}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <AppText variant="label" style={{ color: active ? colors.backgroundDeep : colors.text }}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** The typing box with its send button. */
export function ChatInput({ value, onChange, onSend, busy }: { value: string; onChange: (text: string) => void; onSend: () => void; busy: boolean }) {
  const { t } = useTranslation();
  const off = busy || !value.trim();
  return (
    <View style={styles.inputRow}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('ai.ask.placeholder')}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        multiline
        maxLength={MAX_MESSAGE}
        editable={!busy}
        accessibilityLabel={t('ai.ask.placeholder')}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={t('ai.ask.send')} disabled={off} onPress={onSend} style={[styles.send, off && styles.sendOff]}>
        <MaterialCommunityIcons name="send" size={22} color={colors.backgroundDeep} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  gapSm: { gap: spacing.sm },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  bubble: { padding: spacing.md, borderRadius: radius.lg, gap: spacing.xs, maxWidth: '92%' },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.goldDeep },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.backgroundDeep, borderWidth: 1, borderColor: colors.border },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 140,
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  send: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.4 },
});
