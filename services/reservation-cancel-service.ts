import { supabase } from '@/lib/supabase';

/** Cancels the signed-in student's own unpaid reservation. Throws the database's reason if it refuses. */
export async function cancelReservation(creditId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_reservation', { p_credit_id: creditId });
  if (error) {
    console.error('[ReservationCancel] Failed to cancel reservation:', creditId, error.message);
    throw error;
  }
}
