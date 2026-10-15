import { useEffect, useMemo, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { useAppToast } from '@/components/ui/toast-card';
import { useListing } from '@/hooks/use-listing';
import { toListingAttachment } from '@/utils/listing-attachment';
import type { ListingAttachment } from '@/types/messages';

/**
 * Reads the `attachListingId` search param when the chat opens and derives the
 * composer attachment. The listing itself comes from the same ['listing', id]
 * TanStack Query key the details screen uses, so it's served from cache with no
 * extra network round-trip in the normal flow.
 *
 * The param is intentionally NOT cleared: pressing Enquire again on the
 * details page should re-attach. In-session removal is the caller's job via
 * its own override state.
 */
export function useInitialChatAttachment(): ListingAttachment | null {
  const params = useLocalSearchParams<{ attachListingId?: string | string[] }>();
  const attachListingId = Array.isArray(params.attachListingId)
    ? params.attachListingId[0]
    : params.attachListingId;

  const { data, isError } = useListing(attachListingId ?? '');
  const { showToast } = useAppToast();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (isError && attachListingId && !notifiedRef.current) {
      notifiedRef.current = true;
      showToast({ message: 'That listing could not be attached to your message.', type: 'error' });
    }
  }, [isError, attachListingId, showToast]);

  return useMemo(
    () => (attachListingId && data ? toListingAttachment(data.listing) : null),
    [attachListingId, data],
  );
}