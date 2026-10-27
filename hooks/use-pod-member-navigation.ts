import { useCallback } from 'react';
import { useRouter } from 'expo-router';

import { useAppToast } from '@/components/ui/toast-card';

/**
 * Pod members can be real users or pending invites. Tapping an invite has no
 * profile to open yet, so it explains itself instead of navigating to a 404.
 */
export function usePodMemberNavigation() {
  const router = useRouter();
  const { showToast } = useAppToast();

  return useCallback(
    (userId: string) => {
      if (userId.startsWith('inv-')) {
        showToast({ message: 'They haven\u2019t joined yet \u2014 they\u2019re still deciding.', type: 'info' });
        return;
      }
      router.push(`/roommate/${userId}`);
    },
    [router, showToast],
  );
}
