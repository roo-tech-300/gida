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

export type LandlordListing = {
  id: string;
  title: string;
  status: string | null;
  price_amount: number;
  lease_term: string;
  location_landmark: string;
  city: string;
  number_of_bedrooms: number;
  number_of_bathrooms: number;
  size_sqft: number | null;
  primary_image: string | null;
};

export async function fetchListingsByLandlord(landlordId: string): Promise<LandlordListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      'id, title, status, price_amount, lease_term, location_landmark, city, number_of_bedrooms, number_of_bathrooms, size_sqft, primary_image',
    )
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as LandlordListing[];
}
