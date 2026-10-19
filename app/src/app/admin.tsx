// Admin panel. Only shown to accounts marked as admin in the database; the server checks again.
// It is for the app owner, so it is in English only.
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { type AdminData, getAdmin, giftCredits, setSetting } from '@/admin/api';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/theme';

const MODELS = [
  { value: 'claude-haiku-5-5', label: 'Haiku (cheapest)' },
  { value: 'claude-sonnet-5-5', label: 'Sonnet' },
  { value: 'claude-opus-5-5', label: 'Opus (best)' },
];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <AppText variant="heading" style={styles.digits}>
        {value}
      </AppText>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

export default function AdminScreen() {
  const [data, setData] = useState<AdminData | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [contact, setContact] = useState('');
  const [credits, setCredits] = useState('10');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getAdmin()
      .then(setData)
      .catch(() => setMessage({ text: 'Could not load. Are you signed in as an admin?', tone: 'error' }));
  }, []);
  useFocusEffect(load);

  async function change(key: string, value: unknown) {
    setMessage(null);
    try {
      const settings = await setSetting(key, value);
      setData((d) => (d ? { ...d, settings } : d));
      setMessage({ text: `Saved ${key}.`, tone: 'success' });
    } catch {
      setMessage({ text: `Could not save ${key}.`, tone: 'error' });
    }
  }

  async function gift() {
    setBusy(true);
    setMessage(null);
    try {
      const balance = await giftCredits(contact.trim(), Number(credits));
      setMessage({ text: `Gift sent. Their balance is now ${balance} credits.`, tone: 'success' });
      setContact('');
    } catch {
      setMessage({ text: 'Could not gift: check the e-mail / phone (with country code, e.g. +91…) and the number of credits (1–1000).', tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  const s = data?.stats;
  const settings = data?.settings ?? {};
  return (
    <Screen>
      <BackHeader title="Admin panel" />
      {message ? <Notice tone={message.tone} text={message.text} /> : null}
      {!data ? (
        <ActivityIndicator color={colors.gold} style={styles.loading} />
      ) : (
        <View style={styles.gap}>
          <AppText variant="overline">Last 7 days</AppText>
          <View style={styles.grid}>
            <Stat label="Users (total)" value={s!.users} />
            <Stat label="New users" value={s!.newUsers7d} />
            <Stat label="AI questions today" value={s!.questionsToday} />
            <Stat label="AI questions" value={s!.questions7d} />
            <Stat label="Rashifal written today" value={s!.rashifalToday} />
            <Stat label="AI cost (estimate)" value={`$${data.costUsd7d.toFixed(2)}`} />
            <Stat label="Credits bought" value={s!.creditsBought7d} />
            <Stat label="Test credits given" value={s!.testCredits7d} />
            <Stat label="Credits used" value={s!.creditsSpent7d} />
          </View>
          {s!.aiUsage7d.map((u) => (
            <AppText key={u.model ?? 'none'} variant="caption">
              {u.model}: {u.answers} answers · {u.inputTokens.toLocaleString('en-IN')} tokens in · {u.outputTokens.toLocaleString('en-IN')} out
            </AppText>
          ))}

          <AppText variant="overline">AI models</AppText>
          <Card style={styles.card}>
            <AppText variant="label">Ask AI and personas</AppText>
            <Segmented value={String(settings.chat_model)} onChange={(v) => change('chat_model', v)} options={MODELS} />
            <AppText variant="label">Daily rashifal</AppText>
            <Segmented value={String(settings.rashifal_model)} onChange={(v) => change('rashifal_model', v)} options={MODELS} />
            <AppText variant="caption">Haiku ≈ ₹0.1 per answer · Sonnet ≈ ₹1.8 · Opus ≈ ₹3.5</AppText>
          </Card>

          <AppText variant="overline">Free questions</AppText>
          <Card style={styles.row}>
            <Button variant="outline" title="−" onPress={() => change('free_questions', Math.max(Number(settings.free_questions) - 1, 0))} />
            <AppText variant="heading" style={[styles.flex, styles.center, styles.digits]}>
              {String(settings.free_questions)}
            </AppText>
            <Button variant="outline" title="+" onPress={() => change('free_questions', Math.min(Number(settings.free_questions) + 1, 20))} />
          </Card>

          <AppText variant="overline">Payments</AppText>
          <Card style={styles.card}>
            <Segmented
              value={String(settings.payments_mode)}
              onChange={(v) => change('payments_mode', v)}
              options={[
                { value: 'test', label: 'Test (free)' },
                { value: 'off', label: 'Off' },
                { value: 'live', label: 'Live' },
              ]}
            />
            <AppText variant="caption">
              Test gives credits without payment — switch it to Off or Live before launch. Live uses Google Play billing (see README).
            </AppText>
            {Array.isArray(settings.credit_packs)
              ? (settings.credit_packs as { id: string; credits: number; priceInr: number }[]).map((p) => (
                  <AppText key={p.id} variant="caption">
                    {p.id}: {p.credits} credits · ₹{p.priceInr}
                  </AppText>
                ))
              : null}
          </Card>

          <AppText variant="overline">Gift credits</AppText>
          <Card style={styles.card}>
            <TextField label="User's e-mail or phone (+91…)" value={contact} onChangeText={setContact} autoCapitalize="none" />
            <TextField label="Credits" value={credits} onChangeText={setCredits} keyboardType="number-pad" />
            <Button title="Gift" onPress={gift} loading={busy} disabled={!contact.trim() || !Number(credits)} />
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.md },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  loading: { marginTop: spacing.xl },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: {
    flexBasis: '31%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'CC',
  },
  digits: { fontVariant: ['lining-nums'] },
});
