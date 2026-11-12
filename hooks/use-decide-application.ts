import { useCallback, useState } from 'react';

import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { useAcceptLodgeReservation, useRejectLodgeReservation } from '@/hooks/use-admin-lodge-reservations';
import { notifyUserOfDecision } from '@/services/lodge-reservation-notify';
import type { AdminLodgeReservation } from '@/services/admin-lodge-verification-service';

/** Approve or decline an application from the inbox, then tell every household member. */
export function useDecideApplication() {
  const { profile } = useAuth();
  const adminId = profile?.id;
  const { showToast } = useAppToast();
  const accept = useAcceptLodgeReservation();
  const reject = useRejectLodgeReservation();
  const [busyPodId, setBusyPodId] = useState<string | null>(null);

  const notifyMembers = useCallback(async (application: AdminLodgeReservation, decision: 'accepted' | 'rejected', reason?: string) => {
    if (!adminId) return;
    for (const member of application.members) {
      try {
        await notifyUserOfDecision({
          adminId, userId: member.userId, listingId: application.listingId,
          podId: application.podId, decision, reason,
        });
      } catch (error) {
        console.error('[DecideApplication] Failed to notify member:', member.userId, error);
      }
    }
  }, [adminId]);

  const approve = useCallback(async (application: AdminLodgeReservation): Promise<boolean> => {
    setBusyPodId(application.podId);
    try {
      const ok = await accept.mutateAsync(application.podId);
      if (!ok) {
        showToast({ message: 'Could not approve this request. Please try again.', type: 'error' });
        return false;
      }
      await notifyMembers(application, 'accepted');
      showToast({ message: 'Approved. Everyone in the household can now pay.', type: 'success' });
      return true;
    } catch (error) {
      console.error('[DecideApplication] Approve failed:', error);
      showToast({ message: 'Could not approve this request. Please try again.', type: 'error' });
      return false;
    } finally {
      setBusyPodId(null);
    }
  }, [accept, notifyMembers, showToast]);

  const decline = useCallback(async (application: AdminLodgeReservation, reason: string): Promise<boolean> => {
    setBusyPodId(application.podId);
    try {
      const ok = await reject.mutateAsync({ podId: application.podId, reason });
      if (!ok) {
        showToast({ message: 'Could not decline this request. Please try again.', type: 'error' });
        return false;
      }
      await notifyMembers(application, 'rejected', reason);
      showToast({ message: 'Declined. The household has been told why.', type: 'success' });
      return true;
    } catch (error) {
      console.error('[DecideApplication] Decline failed:', error);
      showToast({ message: 'Could not decline this request. Please try again.', type: 'error' });
      return false;
    } finally {
      setBusyPodId(null);
    }
  }, [reject, notifyMembers, showToast]);

  return { approve, decline, busyPodId };
}
