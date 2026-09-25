import { useMutation } from '@tanstack/react-query';

import { joinWaitlist } from '@/services/waitlist-service';
import type { JoinWaitlistPayload } from '@/types/waitlist';

export function useJoinWaitlist() {
  return useMutation({
    mutationFn: async (payload: JoinWaitlistPayload) => {
      return joinWaitlist(payload);
    },
  });
}
