import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { type ChatMessage, getPersonaChat, type PersonaSession, sendPersonaMessage, startPersonaSession, type Wallet } from '@/ai/api';
import { Bubble, ChatInput, MAX_MESSAGE, PersonChips, VoiceToggle } from '@/ai/ChatParts';
import { PersonaAvatar } from '@/ai/PersonaAvatar';
import { personaInfo, SESSION_MINUTES } from '@/ai/personas';
import { AIBadge } from '@/components/AIBadge';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { ApiError, type BirthProfile, listProfiles } from '@/kundli/api';
import { useSpeaker, useVoiceConversation } from '@/voice/useVoice';
import { colors, spacing } from '@/theme';

type Problem = 'failed' | 'notEnabled' | 'busy' | 'declined' | 'tooLong' | 'notEnough' | 'ended' | 'capReached';

function problemOf(err: unknown): Problem {
  if (!(err instanceof ApiError)) return 'failed';
  if (err.status === 429) return 'busy';
  if (err.status === 503) return 'notEnabled';
  if (err.status === 422) return 'declined';
  if (err.status === 400) return 'tooLong';
  return 'failed';
}

/** Re-renders every 15 seconds so the session countdown stays current. */
function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export default function PersonaChatScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const persona = personaInfo(id);
  const now = useClock();
  const [people, setPeople] = useState<BirthProfile[] | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const chosen = useRef<string | null | undefined>(undefined);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [session, setSession] = useState<PersonaSession>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const speaker = useSpeaker(i18n.language);
  const [voiceOn, setVoiceOn] = useVoiceConversation();

  const load = useCallback(
    (who: string | null) => {
      if (!persona) return;
      getPersonaChat(persona.id, who)
        .then((d) => {
          setWallet(d.wallet);
          setSession(d.session);
          setThreadId(d.thread?.id ?? null);
          setMessages(d.thread?.messages ?? []);
        })
        .catch(() => setProblem('failed'));
    },
    [persona],
  );

  useFocusEffect(
    useCallback(() => {
      listProfiles()
        .then((list) => {
          setPeople(list);
          if (chosen.current === undefined) {
            chosen.current = (list.find((p) => p.isPrimary) ?? list.find((p) => p.relation === 'self') ?? list[0])?.id ?? null;
          }
          setProfileId(chosen.current);
          load(chosen.current);
        })
        .catch(() => setProblem('failed'));
    }, [load]),
  );

  if (!persona) return null;
  const sessionLive = session !== null && Date.parse(session.endsAt) > now;
  const minutesLeft = sessionLive ? Math.max(Math.ceil((Date.parse(session.endsAt) - now) / 60_000), 1) : 0;
  const needsSession = persona.billing === 'minute' && (!sessionLive || session.messagesLeft <= 0);
  const outOfCredits = persona.billing === 'message' && wallet !== null && wallet.credits < persona.price;

  function choosePerson(who: string | null) {
    chosen.current = who;
    setProfileId(who);
    setMessages([]);
    setThreadId(null);
    setProblem(null);
    load(who);
  }

  async function start(minutes: number) {
    if (!persona) return;
    setBusy(true);
    setProblem(null);
    try {
      const result = await startPersonaSession(persona.id, minutes, minutes * persona.price);
      if (result.kind === 'noCredits') setProblem('notEnough');
      else {
        setSession(result.session);
        setWallet(result.wallet);
      }
    } catch (err) {
      setProblem(problemOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function send(spoken?: string) {
    if (!persona) return;
    const message = (spoken ?? text).trim();
    if (!message || busy) return;
    if (message.length > MAX_MESSAGE) return setProblem('tooLong');
    setBusy(true);
    setProblem(null);
    const pending: ChatMessage = { id: `p-${Date.now()}`, role: 'user', text: message, distress: false, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, pending]);
    setText('');
    try {
      const reply = await sendPersonaMessage(
        { personaId: persona.id, billing: persona.billing, price: persona.price, message, language: i18n.language, profileId, threadId },
        t('ai.ask.demoAnswer'),
      );
      if (reply.kind !== 'answered') {
        setMessages((m) => m.filter((x) => x.id !== pending.id));
        setText(message);
        if (reply.kind === 'noCredits') setProblem('notEnough');
        else {
          setProblem(sessionLive ? 'capReached' : 'ended');
          setSession(null);
        }
        return;
      }
      setThreadId(reply.threadId);
      setWallet(reply.wallet);
      setSession(reply.session);
      const id = `a-${Date.now()}`;
      setMessages((m) => [...m, { id, role: 'assistant', text: reply.answer, distress: reply.distress, createdAt: new Date().toISOString() }]);
      if (voiceOn) speaker.speak(id, reply.answer);
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== pending.id));
      setText(message);
      setProblem(problemOf(err));
    } finally {
      setBusy(false);
    }
  }

  const problemText =
    problem === 'notEnough'
      ? t('extra.personas.notEnough')
      : problem === 'ended' || problem === 'capReached'
        ? t(`extra.personas.session.${problem}`)
        : problem
          ? t(`ai.ask.errors.${problem}`)
          : null;

  const footer = (
    <>
      {problemText ? <Notice text={problemText} tone={problem === 'ended' || problem === 'capReached' ? 'info' : 'error'} /> : null}
      {needsSession ? (
        <Card style={styles.gapSm}>
          <AppText variant="bodyStrong">{t('extra.personas.session.title')}</AppText>
          <AppText variant="caption">{t('extra.personas.session.intro')}</AppText>
          {SESSION_MINUTES.map((m) => (
            <Button
              key={m}
              variant="outline"
              title={t('extra.personas.session.option', { count: m, credits: m * persona.price })}
              onPress={() => start(m)}
              disabled={busy || (wallet !== null && wallet.credits < m * persona.price)}
            />
          ))}
          {wallet !== null && wallet.credits < SESSION_MINUTES[0] * persona.price ? (
            <Button title={t('ai.ask.buy')} onPress={() => router.push('/credits')} />
          ) : null}
        </Card>
      ) : outOfCredits ? (
        <Card style={styles.gapSm}>
          <AppText>{t('extra.personas.notEnough')}</AppText>
          <Button title={t('ai.ask.buy')} onPress={() => router.push('/credits')} />
        </Card>
      ) : (
        <ChatInput value={text} onChange={setText} onSend={send} busy={busy} language={i18n.language} autoSend={voiceOn} />
      )}
      <AppText variant="caption" style={styles.center}>
        {t('ai.ask.disclaimer')}
      </AppText>
    </>
  );

  return (
    <Screen footer={footer} scrollToEndOn={messages.length + (busy ? 0.5 : 0)}>
      <BackHeader title={persona.name} />
      <View style={styles.gap}>
        <View style={styles.head}>
          <PersonaAvatar persona={persona} size={60} />
          <View style={styles.flex}>
            <View style={styles.row}>
              <AppText variant="label" style={{ color: persona.color }}>
                {t(`extra.personas.about.${persona.id}.role`)}
              </AppText>
              <AIBadge />
            </View>
            <AppText variant="caption">{t('extra.personas.aiNote', { name: persona.name })}</AppText>
            <AppText variant="caption" style={{ color: colors.textFaint }}>
              {t(persona.billing === 'message' ? 'extra.personas.perMessage' : 'extra.personas.perMinute', { count: persona.price })}
            </AppText>
          </View>
        </View>

        {people ? (
          <View style={styles.gapSm}>
            <AppText variant="overline">{t('ai.ask.aboutWhom')}</AppText>
            <PersonChips people={people} value={profileId} onChange={choosePerson} />
          </View>
        ) : (
          <ActivityIndicator color={colors.gold} />
        )}

        {wallet ? (
          <View style={styles.row}>
            <AppText variant="label" style={[styles.flex, { color: colors.emeraldBright }]}>
              {t('ai.ask.credits', { count: wallet.credits })}
              {sessionLive ? ` · ${t('extra.personas.session.left', { count: minutesLeft })}` : ''}
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => router.push('/credits')} hitSlop={8}>
              <AppText variant="label" style={{ color: colors.gold }}>
                {t('ai.ask.buy')}
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {speaker.available ? <VoiceToggle on={voiceOn} onChange={setVoiceOn} /> : null}
        {messages.map((m) => (
          <Bubble
            key={m.id}
            message={m}
            aiName={persona.name}
            reportAs="persona"
            speaking={speaker.speakingId === m.id}
            onSpeak={speaker.available ? () => (speaker.speakingId === m.id ? speaker.stop() : speaker.speak(m.id, m.text)) : undefined}
          />
        ))}
        {busy ? (
          <View style={styles.row}>
            <ActivityIndicator color={colors.gold} />
            <AppText variant="caption">{t('ai.ask.thinking')}</AppText>
          </View>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
