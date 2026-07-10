import { supabase } from '@/lib/supabase';
import type { OnboardingData } from '@/types/onboarding';

export type ProfileRecord = {
  id: string;
  full_name?: string | null;
  city?: string | null;
  is_student?: boolean | null;
  school?: string | null;
  onboarded?: boolean | null;
};

export async function fetchUserProfile(userId: string): Promise<ProfileRecord | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }
  return data;
}

export function isOnboardingComplete(profile: ProfileRecord | null | undefined): boolean {
  if (!profile) return false;
  if (profile.onboarded) return true;
  return Boolean(profile.city?.trim());
}

export async function saveOnboardingProfile(userId: string, data: OnboardingData) {
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      city: data.city.trim(),
      is_student: data.isStudent,
      school: data.isStudent ? data.school : null,
      onboarded: true,
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: roommateError } = await supabase.from('roommate_preferences').upsert(
    {
      profile_id: userId,
      smoker_allowed: data.smokerAllowed,
      sleep_schedule: data.sleepSchedule,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' },
  );

  if (roommateError) {
    throw new Error(roommateError.message);
  }

  const budget = data.maxBudget ? parseFloat(data.maxBudget) : null;

  const { error: livingError } = await supabase.from('living_preferences').upsert(
    {
      profile_id: userId,
      max_budget: budget,
      preferred_area: data.preferredArea.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' },
  );

  if (livingError) {
    throw new Error(livingError.message);
  }
}
