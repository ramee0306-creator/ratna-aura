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
import { useDictation } from '@/voice/useVoice';
import { type ReportFeature, ReportButton } from './ReportButton';

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

export function Bubble({
  message,
  aiName,
  speaking,
  onSpeak,
  reportAs,
}: {
  message: ChatMessage;
  aiName?: string;
  /** Shows "Report this answer" on AI answers */
  reportAs?: ReportFeature;
  /** This answer is being read aloud */
  speaking?: boolean;
  /** Read aloud / stop; undefined when speech is not available */
  onSpeak?: () => void;
}) {
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
            {onSpeak ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(speaking ? 'extra.voice.stop' : 'extra.voice.speak')}
                onPress={onSpeak}
                hitSlop={10}
                style={styles.speak}
              >
                <MaterialCommunityIcons name={speaking ? 'stop-circle-outline' : 'volume-high'} size={20} color={colors.goldBright} />
              </Pressable>
            ) : null}
            {reportAs ? <ReportButton feature={reportAs} itemId={message.id} text={message.text} /> : null}
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

/** The typing box with its send and microphone buttons. In a voice conversation, a spoken question is sent at once. */
export function ChatInput({
  value,
  onChange,
  onSend,
  busy,
  language,
  autoSend,
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: (text?: string) => void;
  busy: boolean;
  language: string;
  autoSend?: boolean;
}) {
  const { t } = useTranslation();
  const dictation = useDictation(language, (text, final) => {
    onChange(text);
    if (final && autoSend) onSend(text);
  });
  const off = busy || !value.trim();
  const listening = dictation.state === 'listening';
  return (
    <View style={styles.gapSm}>
      {listening ? <AppText variant="caption" style={{ color: colors.emeraldBright }}>{t('extra.voice.listening')}</AppText> : null}
      {dictation.state === 'denied' || dictation.state === 'error' ? (
        <AppText variant="caption" style={{ color: colors.danger }}>
          {t(dictation.state === 'denied' ? 'extra.voice.denied' : 'extra.voice.error')}
        </AppText>
      ) : null}
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
        {dictation.available ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('extra.voice.mic')}
            disabled={busy}
            onPress={listening ? dictation.stop : dictation.start}
            style={[styles.mic, listening && styles.micOn, busy && styles.sendOff]}
          >
            <MaterialCommunityIcons name={listening ? 'microphone' : 'microphone-outline'} size={24} color={listening ? colors.backgroundDeep : colors.goldBright} />
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" accessibilityLabel={t('ai.ask.send')} disabled={off} onPress={() => onSend()} style={[styles.send, off && styles.sendOff]}>
          <MaterialCommunityIcons name="send" size={22} color={colors.backgroundDeep} />
        </Pressable>
      </View>
    </View>
  );
}

/** "Voice conversation" switch: answers are read aloud and spoken questions are sent straight away. */
export function VoiceToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={() => onChange(!on)}
      style={[styles.voiceToggle, on && styles.chipActive]}
    >
      <MaterialCommunityIcons name={on ? 'account-voice' : 'account-voice-off'} size={18} color={on ? colors.backgroundDeep : colors.goldBright} />
      <AppText variant="label" style={{ color: on ? colors.backgroundDeep : colors.text }}>
        {t('extra.voice.conversation')}
      </AppText>
    </Pressable>
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
  mic: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  micOn: { backgroundColor: colors.emeraldBright, borderColor: colors.emeraldBright },
  speak: { marginLeft: 'auto' },
  voiceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
