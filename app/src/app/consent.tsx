import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { savePendingConsent } from '@/auth/consent';
import { BackHeader } from '@/components/BackHeader';
import { ConsentForm } from '@/components/ConsentForm';
import { Screen } from '@/components/Screen';

/** Shown before sign-in. The answer is saved on the phone and sent to the server right after sign-in. */
export default function ConsentScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <BackHeader title={t('consent.title')} />
      <ConsentForm
        onAccept={async () => {
          await savePendingConsent();
          router.push('/login');
        }}
      />
    </Screen>
  );
}
