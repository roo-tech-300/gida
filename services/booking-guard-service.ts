import { supabase } from '@/lib/supabase';

// Backend guard for "one active booking per user per listing".
// Mirrors the wording raised by the join_pod RPC and the
// trg_enforce_single_active_booking trigger so every flow reads the same.

export const ALREADY_RESERVED_MESSAGE = 'You already have an active reservation for this property.';

/** Maps insert failures that mean "an active booking already exists". */
export function isAlreadyReservedError(message: string, code?: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(ALREADY_RESERVED_MESSAGE.toLowerCase()) ||
    lower.includes('you already have a spot reserved on this property') ||
    (code === '23505' && lower.includes('slot_credits_user_listing_key'))
  );
}

/**
 * Asks the database whether the current user already holds a non-expired
 * booking for this listing. Returns the active credit id, or null when
 * booking is allowed (expired bookings never block).
 *
 * Falls back to null when the RPC is unreachable so the local check in
 * purchaseSlotCredit plus the BEFORE INSERT trigger still protect us.
 */
export async function hasActiveBooking(listingId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('has_active_booking', {
      p_listing_id: listingId,
    });
    if (error) {
      console.error('[BookingGuard] has_active_booking RPC failed:', error.message);
      return null;
    }
    return typeof data === 'string' && data.length > 0 ? data : null;
  } catch (error) {
    console.error('[BookingGuard] Exception during has_active_booking check:', error);
    return null;
  }
}
