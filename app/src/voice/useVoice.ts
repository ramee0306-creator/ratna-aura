// Voice for the chats: speak a question (speech-to-text) and hear answers (text-to-speech).
// Both use the phone's own speech services: free, and the audio never reaches our server.
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

import { speechLocale } from './locales';

type Recognition = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

// The speech-recognition module is missing in Expo Go; then the microphone button is simply hidden.
let recognition: Recognition | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- must not crash where the native module is missing
  recognition = (require('expo-speech-recognition') as typeof import('expo-speech-recognition')).ExpoSpeechRecognitionModule;
} catch {
  recognition = null;
}

export type DictationState = 'idle' | 'listening' | 'denied' | 'error';

/** Microphone → text in the app language. `onText` gets the final text. */
export function useDictation(language: string, onText: (text: string, final: boolean) => void) {
  const [state, setState] = useState<DictationState>('idle');
  const locale = speechLocale(language);
  const callback = useRef(onText);
  useEffect(() => {
    callback.current = onText;
  }, [onText]);

  let available = false;
  try {
    available = recognition !== null && locale !== null && recognition.isRecognitionAvailable();
  } catch {
    available = false;
  }

  useEffect(() => {
    if (!recognition || !available) return;
    const subs = [
      recognition.addListener('result', (event) => {
        const text = event.results[0]?.transcript ?? '';
        if (text) callback.current(text, event.isFinal);
      }),
      recognition.addListener('end', () => setState((s) => (s === 'listening' ? 'idle' : s))),
      recognition.addListener('error', (event) => setState(event.error === 'not-allowed' ? 'denied' : event.error === 'no-speech' ? 'idle' : 'error')),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [available]);

  const start = useCallback(async () => {
    if (!recognition || !locale) return;
    Speech.stop();
    const { granted } = await recognition.requestPermissionsAsync();
    if (!granted) return setState('denied');
    setState('listening');
    recognition.start({ lang: locale, interimResults: true, continuous: false, addsPunctuation: true });
  }, [locale]);

  const stop = useCallback(() => recognition?.stop(), []);

  return { available, state, start, stop };
}

/** Reading answers aloud. Only one text is spoken at a time. */
export function useSpeaker(language: string) {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const locale = speechLocale(language);

  useEffect(() => () => void Speech.stop(), []);

  const speak = useCallback(
    (id: string, text: string) => {
      Speech.stop();
      if (!locale) return;
      setSpeakingId(id);
      Speech.speak(text, { language: locale, rate: 0.95, onDone: () => setSpeakingId(null), onStopped: () => setSpeakingId(null), onError: () => setSpeakingId(null) });
    },
    [locale],
  );
  const stop = useCallback(() => {
    Speech.stop();
    setSpeakingId(null);
  }, []);

  return { available: locale !== null, speakingId, speak, stop };
}

const VOICE_KEY = 'voice.conversation';

/** Whether "Voice conversation" is on (remembered on the phone). */
export function useVoiceConversation(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    import('@react-native-async-storage/async-storage')
      .then(({ default: storage }) => storage.getItem(VOICE_KEY))
      .then((v) => setOn(v === '1'))
      .catch(() => undefined);
  }, []);
  const change = useCallback((value: boolean) => {
    setOn(value);
    if (!value) Speech.stop();
    import('@react-native-async-storage/async-storage')
      .then(({ default: storage }) => storage.setItem(VOICE_KEY, value ? '1' : '0'))
      .catch(() => undefined);
  }, []);
  return [on, change];
}
