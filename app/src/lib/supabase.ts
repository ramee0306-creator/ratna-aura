import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { LargeSecureStore } from './secure-storage';

// These two values are PUBLIC by design (Supabase calls it the "publishable" key).
// Security comes from the database rules (Row Level Security), not from hiding them.
// The SECRET key must never be put here — it lives only on the server.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

/**
 * Demo mode lets you click through the screens before the server exists.
 * It can only switch on when NO server is configured, so it can never
 * bypass a real login.
 */
export const isDemoMode = !isSupabaseConfigured && process.env.EXPO_PUBLIC_DEMO_MODE === '1';

export const supabase = createClient(url || 'https://not-configured.invalid', publishableKey || 'not-configured', {
  auth: {
    // On the web preview the browser's own storage is used.
    ...(Platform.OS !== 'web' ? { storage: new LargeSecureStore() } : {}),
    autoRefreshToken: isSupabaseConfigured,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Refresh the login token only while the app is open (saves battery and data).
if (Platform.OS !== 'web' && isSupabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
