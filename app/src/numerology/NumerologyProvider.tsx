// Remembers the numerology details (yours and the last person you compared with)
// and your preferred method, separately for each signed-in person.
import { createContext, type ReactNode, use, useCallback, useEffect, useMemo, useState } from 'react';
import type { NumerologySystem } from '@ratna/numerology';

import { useAuth } from '@/auth/AuthProvider';
import { getUserData, setUserData } from '@/lib/user-storage';

import type { PersonDetails } from './details';

type Saved = { me: PersonDetails | null; partner: PersonDetails | null; system: NumerologySystem };

type NumerologyContextValue = Saved & {
  loaded: boolean;
  saveMe: (details: PersonDetails) => Promise<void>;
  savePartner: (details: PersonDetails | null) => Promise<void>;
  setSystem: (system: NumerologySystem) => Promise<void>;
};

const NumerologyContext = createContext<NumerologyContextValue | null>(null);

export function NumerologyProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [saved, setSaved] = useState<(Saved & { userId: string }) | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([
      getUserData<PersonDetails>(userId, 'numerology.me'),
      getUserData<PersonDetails>(userId, 'numerology.partner'),
      getUserData<NumerologySystem>(userId, 'numerology.system'),
    ]).then(([me, partner, system]) => {
      if (!cancelled) setSaved({ userId, me, partner, system: system ?? 'chaldean' });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const current = saved && saved.userId === userId ? saved : null;

  const update = useCallback(
    async (patch: Partial<Saved>) => {
      if (!userId) return;
      setSaved((prev) => ({
        userId,
        me: null,
        partner: null,
        system: 'chaldean',
        ...(prev?.userId === userId ? prev : {}),
        ...patch,
      }));
      if ('me' in patch) await setUserData(userId, 'numerology.me', patch.me);
      if ('partner' in patch) await setUserData(userId, 'numerology.partner', patch.partner);
      if ('system' in patch) await setUserData(userId, 'numerology.system', patch.system);
    },
    [userId],
  );

  const value = useMemo<NumerologyContextValue>(
    () => ({
      loaded: current !== null,
      me: current?.me ?? null,
      partner: current?.partner ?? null,
      system: current?.system ?? 'chaldean',
      saveMe: (me) => update({ me }),
      savePartner: (partner) => update({ partner }),
      setSystem: (system) => update({ system }),
    }),
    [current, update],
  );

  return <NumerologyContext value={value}>{children}</NumerologyContext>;
}

export function useNumerology(): NumerologyContextValue {
  const value = use(NumerologyContext);
  if (!value) throw new Error('useNumerology must be used inside <NumerologyProvider>');
  return value;
}
