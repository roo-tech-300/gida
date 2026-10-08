import { supabase } from '@/lib/supabase';

export type PaymentApiHeaders = {
  Authorization: string;
  apikey: string;
};

export async function getPaymentAuthorizationHeader(): Promise<PaymentApiHeaders> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[PaymentApi] Failed to read authenticated session:', error.message);
    throw new Error('Sign in again before making a payment.');
  }
  if (!data.session?.access_token) throw new Error('Sign in before making a payment.');
  const apikey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!apikey) throw new Error('Payment authentication is unavailable. Please try again later.');
  return { Authorization: `Bearer ${data.session.access_token}`, apikey };
}
