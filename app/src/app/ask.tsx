import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ask, type ChatMessage, getChat, type Wallet } from '@/ai/api';
import { AIBadge } from '@/components/AIBadge';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { ApiError, type BirthProfile, listProfiles } from '@/kundli/api';
import { colors, fonts, radius, spacing } from '@/theme';

const MAX_QUESTION = 1000;
const SUGGESTIONS = ['career', 'marriage', 'year', 'numbers'] as const;
type ErrorKey = 'failed' | 'notEnabled' | 'busy' | 'declined' | 'tooLong';

function errorKey(err: unknown): ErrorKey {
  if (!(err instanceof ApiError)) return 'failed';
  if (err.status === 429) return 'busy';
  if (err.status === 503) return 'notEnabled';
  if (err.status === 422) return 'declined';
  if (err.status === 400) return 'tooLong';
  return 'failed';
}

function Helpline() {
  const { t } = useTranslation();
  return (
    <Card style={[styles.gapSm, { borderColor: colors.emerald }]}>
      <AppText variant="bodyStrong">{t('ai.ask.helplineTitle')}</AppText>
      <AppText>{t('ai.ask.helpline')}</AppText>
      <Button variant="outline" title={t('ai.ask.callHelpline')} onPress={() => Linking.openURL('tel:14416')} />
    </Card>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const { t } = useTranslation();
  const mine = message.role === 'user';
  return (
    <View style={styles.gapSm}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        {!mine ? (
          <View style={styles.aiHead}>
            <AppText variant="label" style={{ color: colors.gold }}>
              {t('ai.ask.aiName')}
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

function PersonChips({ people, value, onChange }: { people: BirthProfile[]; value: string | null; onChange: (id: string | null) => void }) {
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

export default function AskScreen() {
  const { t, i18n } = useTranslation();
  const [people, setPeople] = useState<BirthProfile[] | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  // Whose chart was chosen, also kept outside React state so returning to the screen keeps the choice.
  const chosen = useRef<string | null | undefined>(undefined);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [noCredits, setNoCredits] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadChat = useCallback((id: string | null) => {
    setLoadFailed(false);
    getChat(id)
      .then(({ wallet: w, thread }) => {
        setWallet(w);
        setThreadId(thread?.id ?? null);
        setMessages(thread?.messages ?? []);
        setNoCredits(w.freeLeft === 0 && w.credits === 0);
      })
      .catch(() => setLoadFailed(true));
  }, []);

  // On opening (and on coming back from buying credits): load people, then the conversation.
  useFocusEffect(
    useCallback(() => {
      listProfiles()
        .then((list) => {
          setPeople(list);
          if (chosen.current === undefined) {
            chosen.current = (list.find((p) => p.isPrimary) ?? list.find((p) => p.relation === 'self') ?? list[0])?.id ?? null;
          }
          setProfileId(chosen.current);
          loadChat(chosen.current);
        })
        .catch(() => setLoadFailed(true));
    }, [loadChat]),
  );

  function choosePerson(id: string | null) {
    chosen.current = id;
    setProfileId(id);
    setMessages([]);
    setThreadId(null);
    setError(null);
    loadChat(id);
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    if (q.length > MAX_QUESTION) return setError('tooLong');
    setBusy(true);
    setError(null);
    const pending: ChatMessage = { id: `pending-${Date.now()}`, role: 'user', text: q, distress: false, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, pending]);
    setQuestion('');
    try {
      const result = await ask({ question: q, language: i18n.language, profileId, threadId }, t('ai.ask.demoAnswer'));
      if (result.kind === 'noCredits') {
        setMessages((m) => m.filter((x) => x.id !== pending.id));
        setQuestion(q);
        setNoCredits(true);
        return;
      }
      setThreadId(result.threadId);
      setWallet(result.wallet);
      setNoCredits(result.wallet.freeLeft === 0 && result.wallet.credits === 0);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', text: result.answer, distress: result.distress, createdAt: new Date().toISOString() }]);
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== pending.id));
      setQuestion(q);
      setError(errorKey(err));
    } finally {
      setBusy(false);
    }
  }

  const balance = wallet
    ? wallet.freeLeft > 0
      ? t('ai.ask.freeLeft', { count: wallet.freeLeft })
      : t('ai.ask.credits', { count: wallet.credits })
    : '';

  const footer = (
    <>
      {error ? <Notice text={t(`ai.ask.errors.${error}`)} /> : null}
      {noCredits ? (
        <Card style={styles.gapSm}>
          <AppText>{t('ai.ask.noneLeft')}</AppText>
          <Button title={t('ai.ask.buy')} onPress={() => router.push('/credits')} />
        </Card>
      ) : (
        <View style={styles.inputRow}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder={t('ai.ask.placeholder')}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            multiline
            maxLength={MAX_QUESTION}
            editable={!busy}
            accessibilityLabel={t('ai.ask.placeholder')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ai.ask.send')}
            disabled={busy || !question.trim()}
            onPress={() => send(question)}
            style={[styles.send, (busy || !question.trim()) && styles.sendOff]}
          >
            <MaterialCommunityIcons name="send" size={22} color={colors.backgroundDeep} />
          </Pressable>
        </View>
      )}
      <AppText variant="caption" style={styles.center}>
        {t('ai.ask.disclaimer')}
      </AppText>
    </>
  );

  return (
    <Screen footer={footer} scrollToEndOn={messages.length + (busy ? 0.5 : 0)}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <BackHeader title={t('ai.ask.title')} />
        </View>
        <AIBadge />
      </View>
      <View style={styles.gap}>
        <AppText variant="caption">{t('ai.ask.intro')}</AppText>
        {people === null && !loadFailed ? <ActivityIndicator color={colors.gold} /> : null}
        {loadFailed ? <Notice text={t('ai.ask.errors.failed')} /> : null}
        {people ? (
          <View style={styles.gapSm}>
            <AppText variant="overline">{t('ai.ask.aboutWhom')}</AppText>
            <PersonChips people={people} value={profileId} onChange={choosePerson} />
            {people.length === 0 ? (
              <Pressable accessibilityRole="button" onPress={() => router.push('/kundli/new')}>
                <AppText variant="caption" style={{ color: colors.gold }}>
                  {t('ai.ask.noPeople')} {t('ai.ask.addKundli')} →
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {wallet ? (
          <View style={styles.walletRow}>
            <AppText variant="label" style={[styles.flex, { color: colors.emeraldBright }]}>
              {balance}
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => router.push('/credits')} hitSlop={8}>
              <AppText variant="label" style={{ color: colors.gold }}>
                {t('ai.ask.buy')}
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {messages.length === 0 && wallet ? (
          <View style={styles.gapSm}>
            <AppText variant="overline">{t('ai.ask.suggestionsTitle')}</AppText>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} accessibilityRole="button" onPress={() => setQuestion(t(`ai.ask.suggestions.${s}`))} style={styles.suggestion}>
                <MaterialCommunityIcons name="star-four-points-outline" size={16} color={colors.gold} />
                <AppText style={styles.flex}>{t(`ai.ask.suggestions.${s}`)}</AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
        {busy ? (
          <View style={styles.thinking}>
            <ActivityIndicator color={colors.gold} />
            <AppText variant="caption">{t('ai.ask.thinking')}</AppText>
          </View>
        ) : null}
        {messages.length > 0 && !busy ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setThreadId(null);
              setMessages([]);
            }}
            style={styles.newChat}
          >
            <MaterialCommunityIcons name="plus" size={16} color={colors.textMuted} />
            <AppText variant="caption">{t('ai.ask.newChat')}</AppText>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.lg },
  gapSm: { gap: spacing.sm },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  walletRow: { flexDirection: 'row', alignItems: 'center' },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'CC',
  },
  bubble: { padding: spacing.md, borderRadius: radius.lg, gap: spacing.xs, maxWidth: '92%' },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.goldDeep },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.backgroundDeep, borderWidth: 1, borderColor: colors.border },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  newChat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'center', padding: spacing.sm },
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
