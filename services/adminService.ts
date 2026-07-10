import { supabase } from '@/lib/supabase';

export type AdminListing = {
  id: string;
  title: string;
  price_amount: number;
  location_landmark: string;
  city: string;
  primary_image: string | null;
  featured: boolean;
  status: string;
  created_at: string;
};

export async function fetchAdminListings(adminId: string): Promise<AdminListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, price_amount, location_landmark, city, primary_image, featured, status, created_at')
    .eq('agent_id', adminId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as AdminListing[];
}
