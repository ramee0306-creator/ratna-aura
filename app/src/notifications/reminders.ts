// The daily rashifal reminder: a notification scheduled on the phone itself (no server, no cost).
// Tapping it opens the rashifal screen (see the listener in app/_layout.tsx).
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

const KEY = 'reminder.rashifal';
const CHANNEL = 'daily';

export type Reminder = { enabled: boolean; hour: number; minute: number };
export const DEFAULT_REMINDER: Reminder = { enabled: false, hour: 7, minute: 0 };

/** Local notifications work on Android and iOS, not in the web preview. */
export const remindersSupported = Platform.OS !== 'web';

export async function getReminder(): Promise<Reminder> {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    return saved ? { ...DEFAULT_REMINDER, ...(JSON.parse(saved) as Partial<Reminder>) } : DEFAULT_REMINDER;
  } catch {
    return DEFAULT_REMINDER;
  }
}

/**
 * Turns the reminder on (asking for permission if needed) or off.
 * Returns false if the user did not allow notifications.
 */
export async function setReminder(reminder: Reminder, text: { title: string; body: string; channel: string }): Promise<boolean> {
  if (!remindersSupported) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (reminder.enabled) {
    const { granted } = await Notifications.requestPermissionsAsync();
    if (!granted) return false;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, { name: text.channel, importance: AndroidImportance.DEFAULT });
    }
    await Notifications.scheduleNotificationAsync({
      content: { title: text.title, body: text.body, data: { url: '/rashifal' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: reminder.hour, minute: reminder.minute, channelId: CHANNEL },
    });
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(reminder));
  return true;
}
