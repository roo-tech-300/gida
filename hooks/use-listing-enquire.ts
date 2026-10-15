import { useCallback } from 'react';
import { router } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import type { DbListing } from '@/types/feed-listing';

/**
 * Enquiry flow: opens the chat with the listing's ADMIN (never the landlord —
 * all in-app deals go through the admin) with the listing pre-attached in the
 * composer. Nothing is sent until the user types a message and hits send.
 */
export function useListingEnquire(dbListing: DbListing | undefined, listingId: string) {
  const { profile } = useAuth();
  const myId = profile?.id;
  const adminId = dbListing?.admin_id;

  // Hidden on your own listings — you can't enquire with yourself.
  const canEnquire = Boolean(adminId) && adminId !== myId;

  const enquire = useCallback(() => {
    if (!adminId) {
      console.error('[ListingEnquire] Cannot enquire: listing has no admin owner.');
      return;
    }
    router.push(`/messages/${adminId}?attachListingId=${listingId}`);
  }, [adminId, listingId]);

  return { canEnquire, enquire };
}