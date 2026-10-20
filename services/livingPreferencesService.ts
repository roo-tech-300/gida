import { supabase } from '@/lib/supabase';

export type LivingPreferencesRow = {
  profile_id: string;
  max_budget: number | null;
  preferred_area: string | null;
  preferred_layout: string | null;
  min_bedrooms: number | null;
  min_budget: number | null;
  updated_at: string | null;
};

export async function fetchLivingPreferences(userId: string): Promise<LivingPreferencesRow | null> {
  const { data, error } = await supabase
    .from('living_preferences')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as LivingPreferencesRow | null) ?? null;
}
export async function updateLivingPreferences(
  userId: string,
  data: {
    maxBudget?: string | number | null;
    preferredArea?: string | null;
    preferredLayout?: string | null;
    minBedrooms?: string | number | null;
    minBudget?: string | number | null;
  },
): Promise<void> {
  const maxBudget =
    data.maxBudget != null ? parseFloat(String(data.maxBudget)) : null;
  const minBudget =
    data.minBudget != null ? parseFloat(String(data.minBudget)) : null;
  const minBedrooms =
    data.minBedrooms != null ? parseInt(String(data.minBedrooms), 10) : null;

  const { error } = await supabase.from('living_preferences').upsert(
    {
      profile_id: userId,
      max_budget: maxBudget,
      preferred_area: data.preferredArea?.trim() || null,
      preferred_layout: data.preferredLayout?.trim() || null,
      min_bedrooms: minBedrooms,
      min_budget: minBudget,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' },
  );

  if (error) throw new Error(error.message);
}
