import { supabase } from '@/lib/supabase';

export type CreateLandlordInput = {
  full_name: string;
  phone_number: string;
  email?: string | null;
  payout_details?: Record<string, string> | null;
};

export type Landlord = {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  payout_details: Record<string, string> | null;
  created_at: string;
};

export type LandlordWithCount = Landlord & {
  listings: { count: number };
};

export async function createLandlord(input: CreateLandlordInput): Promise<Landlord> {
  const { data, error } = await supabase
    .from('landlords')
    .insert({
      full_name: input.full_name,
      phone_number: input.phone_number,
      email: input.email ?? null,
      payout_details: input.payout_details ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Landlord;
}

export async function fetchLandlords(): Promise<LandlordWithCount[]> {
  const { data, error } = await supabase
    .from('landlords')
    .select('*, listings:listings(count)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as LandlordWithCount[];
}
