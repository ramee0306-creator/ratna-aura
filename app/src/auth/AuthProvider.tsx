import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, type ReactNode, use, useCallback, useEffect, useMemo, useState } from 'react';

import { isDemoMode, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { clearUserData } from '@/lib/user-storage';

import { clearPendingConsent, CURRENT_CONSENT_VERSION, getPendingConsent, savePendingConsent } from './consent';
import { formatIndianMobile } from './phone';

WebBrowser.maybeCompleteAuthSession();

export type Profile = {
  id: string;
  display_name: string | null;
  preferred_language: string;
  age_confirmed_at: string | null;
  consent_version: number | null;
  /** Can open the admin panel (set only in the database). */
  is_admin?: boolean;
};

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: Status;
  /** Signed in, but has not yet accepted the current privacy notice / 18+ check */
  needsConsent: boolean;
  profile: Profile | null;
  /** The signed-in user's id (used to keep each person's saved data separate) */
  userId: string | null;
  /** Phone number or e-mail, for display */
  accountLabel: string | null;
  sendOtp: (phoneE164: string) => Promise<void>;
  verifyOtp: (phoneE164: string, code: string) => Promise<void>;
  signInWithGoogle: () => Promise<'success' | 'cancelled'>;
  acceptTerms: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, preferred_language, age_confirmed_at, consent_version, is_admin')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const hasConsented = (p: Profile | null) =>
  !!p && !!p.age_confirmed_at && (p.consent_version ?? 0) >= CURRENT_CONSENT_VERSION;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(!isSupabaseConfigured);
  // The account row, remembered together with the user it belongs to.
  const [loaded, setLoaded] = useState<{ userId: string; profile: Profile | null } | null>(null);
  const [demoAccount, setDemoAccount] = useState<string | null>(null);
  const [demoProfile, setDemoProfile] = useState<Profile | null>(null);

  // 1. Follow the login session.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  // 2. When someone signs in, load their account row and record any consent given before sign-in.
  const userId = session?.user.id ?? null;
  const profileLoaded = !userId || loaded?.userId === userId;
  const profile = isDemoMode ? demoProfile : userId && loaded?.userId === userId ? loaded.profile : null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        let p = await fetchProfile(userId);
        if (!hasConsented(p) && (await getPendingConsent())) {
          const { error } = await supabase.rpc('accept_terms', {
            p_consent_version: CURRENT_CONSENT_VERSION,
            p_is_adult: true,
          });
          if (!error) {
            await clearPendingConsent();
            p = await fetchProfile(userId);
          }
        }
        if (!cancelled) setLoaded({ userId, profile: p });
      } catch (err) {
        console.warn('Could not load profile', err);
        if (!cancelled) setLoaded({ userId, profile: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const sendOtp = useCallback(async (phone: string) => {
    if (isDemoMode) return;
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  }, []);

  /** Demo mode (no server): "signs in" a sample account. */
  const demoSignIn = useCallback(async (account: string) => {
    const consent = await getPendingConsent();
    setDemoProfile({
      id: DEMO_USER_ID,
      display_name: null,
      preferred_language: 'en',
      age_confirmed_at: consent ? consent.acceptedAt : null,
      consent_version: consent ? consent.version : null,
      // In demo mode the admin panel is shown (with sample numbers) so it can be tried out.
      is_admin: true,
    });
    setDemoAccount(account);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    if (isDemoMode) return demoSignIn(phone);
    const { error } = await supabase.auth.verifyOtp({ phone, token: code.trim(), type: 'sms' });
    if (error) throw error;
  }, [demoSignIn]);

  const signInWithGoogle = useCallback(async (): Promise<'success' | 'cancelled'> => {
    if (isDemoMode) {
      await demoSignIn('demo@gmail.com');
      return 'success';
    }
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return 'cancelled';
    const params = Linking.parse(result.url).queryParams ?? {};
    if (typeof params.error_description === 'string') throw new Error(params.error_description);
    if (typeof params.code !== 'string') throw new Error('Google sign-in did not return a code');
    const exchange = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchange.error) throw exchange.error;
    return 'success';
  }, [demoSignIn]);

  const acceptTerms = useCallback(async () => {
    if (isDemoMode) {
      await savePendingConsent();
      setDemoProfile((p) =>
        p ? { ...p, consent_version: CURRENT_CONSENT_VERSION, age_confirmed_at: new Date().toISOString() } : p,
      );
      return;
    }
    const { error } = await supabase.rpc('accept_terms', {
      p_consent_version: CURRENT_CONSENT_VERSION,
      p_is_adult: true,
    });
    if (error) throw error;
    if (userId) setLoaded({ userId, profile: await fetchProfile(userId) });
  }, [userId]);

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      setDemoAccount(null);
      setDemoProfile(null);
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const deleteAccount = useCallback(async () => {
    if (isDemoMode) {
      await clearPendingConsent();
      await clearUserData(DEMO_USER_ID);
      setDemoAccount(null);
      setDemoProfile(null);
      return;
    }
    const { error } = await supabase.functions.invoke('delete-account', { body: { confirm: 'DELETE' } });
    if (error) throw error;
    await clearPendingConsent();
    if (userId) await clearUserData(userId);
    // The account no longer exists on the server, so just forget the session on this phone.
    await supabase.auth.signOut({ scope: 'local' });
  }, [userId]);

  const value = useMemo<AuthContextValue>(() => {
    const signedIn = isDemoMode ? demoAccount !== null : session !== null;
    const status: Status =
      !sessionLoaded || (signedIn && !isDemoMode && !profileLoaded) ? 'loading' : signedIn ? 'signedIn' : 'signedOut';
    return {
      status,
      needsConsent: signedIn && !hasConsented(profile),
      profile,
      userId: isDemoMode ? (demoAccount ? DEMO_USER_ID : null) : userId,
      accountLabel: isDemoMode
        ? demoAccount && formatIndianMobile(demoAccount)
        : session?.user.phone
          ? formatIndianMobile(`+${session.user.phone}`)
          : (session?.user.email ?? null),
      sendOtp,
      verifyOtp,
      signInWithGoogle,
      acceptTerms,
      signOut,
      deleteAccount,
    };
  }, [
    session,
    userId,
    sessionLoaded,
    profile,
    profileLoaded,
    demoAccount,
    sendOtp,
    verifyOtp,
    signInWithGoogle,
    acceptTerms,
    signOut,
    deleteAccount,
  ]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
