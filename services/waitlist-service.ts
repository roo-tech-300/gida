import { supabase } from '@/lib/supabase';
import type { JoinWaitlistPayload } from '@/types/waitlist';

const UNIQUE_VIOLATION = '23505';

/**
 * Adds an email to the waitlist. The `waitlist` table is insert-only for
 * anon (no select policy), so we can't read the row back — we only need
 * to know whether this was a new signup or a repeat one.
 */
export async function joinWaitlist(payload: JoinWaitlistPayload): Promise<{ alreadyJoined: boolean }> {
  const email = payload.email.trim().toLowerCase();

  const { error } = await supabase.from('waitlist').insert({ email });

  if (!error) {
    return { alreadyJoined: false };
  }

  if (error.code === UNIQUE_VIOLATION) {
    return { alreadyJoined: true };
  }

  console.error('[joinWaitlist] Failed to join waitlist:', error);
  throw new Error('Something went wrong. Please try again.');
}
