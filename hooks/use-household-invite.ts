import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createHouseholdInvite,
  fetchHouseholdSeats,
  fetchInvitePage,
  joinHouseholdInvite,
  revokeHouseholdInvite,
  type CreatedInvite,
  type JoinedInvite,
} from '@/services/household-invite-service';
import { isValidInviteToken } from '@/utils/invite-link';
import type { HouseholdSeats, InvitePage } from '@/utils/invite-parse';

const PAGE_STALE_MS = 10_000;
const SEATS_STALE_MS = 15_000;
const SEATS_REFRESH_MS = 30_000;

/** The public page for a link. Re-read often: seats and hold times change while people decide. */
export function useInvitePage(token: string | undefined) {
  return useQuery<InvitePage, Error>({
    queryKey: ['invite-page', token],
    queryFn: () => fetchInvitePage(token as string),
    enabled: isValidInviteToken(token),
    staleTime: PAGE_STALE_MS,
    retry: 1,
  });
}

/** Founder's seat list. Refreshes itself so "22h left to pay" and "seat released" stay honest. */
export function useHouseholdSeats(podId: string | undefined) {
  return useQuery<HouseholdSeats, Error>({
    queryKey: ['household-seats', podId],
    queryFn: () => fetchHouseholdSeats(podId as string),
    enabled: !!podId,
    staleTime: SEATS_STALE_MS,
    refetchInterval: SEATS_REFRESH_MS,
  });
}

function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of ['household-seats', 'invite-page', 'user-slot-credits', 'spots-left', 'active-pods', 'open-pods']) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

export function useCreateInvite(podId: string | undefined) {
  const refresh = useRefreshAfterChange();
  return useMutation<CreatedInvite, Error, void>({
    mutationFn: () => {
      if (!podId) throw new Error('Open your household first.');
      return createHouseholdInvite(podId);
    },
    onSuccess: refresh,
  });
}

export function useRevokeInvite() {
  const refresh = useRefreshAfterChange();
  return useMutation<void, Error, string>({ mutationFn: revokeHouseholdInvite, onSuccess: refresh });
}

export function useJoinInvite() {
  const refresh = useRefreshAfterChange();
  return useMutation<JoinedInvite, Error, string>({ mutationFn: joinHouseholdInvite, onSuccess: refresh });
}
