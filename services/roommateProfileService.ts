import { supabase } from '@/lib/supabase';

export type RoommateOnboardingData = {
  bio?: string;
  birthYear?: number;
  entryYear?: number;
  programDuration?: number;
  religion?: string;
  maxBudget?: number;
  preferredArea?: string;
  sleepSchedule?: string;
  cleanlinessLevel?: string;
  guestPolicy?: string;
  studyHabitat?: string;
  personalityVibe?: string;
  smokerAllowed?: boolean;
  religionPreference?: string;
};

export async function fetchMyRoommatePreferences(userId: string) {
  const [rpResult, lpResult] = await Promise.all([
    supabase.from('roommate_preferences').select('*').eq('profile_id', userId).maybeSingle(),
    supabase.from('living_preferences').select('*').eq('profile_id', userId).maybeSingle(),
  ]);

  if (rpResult.error) console.error('[fetchMyRoommatePreferences] roommate_preferences:', rpResult.error);
  if (lpResult.error) console.error('[fetchMyRoommatePreferences] living_preferences:', lpResult.error);

  return {
    roommate: rpResult.data ?? null,
    living: lpResult.data ?? null,
  };
}

export async function saveRoommateProfile(
  userId: string,
  data: RoommateOnboardingData,
) {
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      bio: data.bio || null,
      birth_year: data.birthYear || null,
      entry_year: data.entryYear || null,
      program_duration: data.programDuration || 5,
      religion: data.religion || null,
      show_in_roommate_feed: true,
    })
    .eq('id', userId);

  if (profileError) throw profileError;

  if (data.maxBudget || data.preferredArea) {
    const { error: livingError } = await supabase
      .from('living_preferences')
      .upsert(
        {
          profile_id: userId,
          max_budget: data.maxBudget || null,
          preferred_area: data.preferredArea || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' },
      );
    if (livingError) throw livingError;
  }

  const { error: rpError } = await supabase
    .from('roommate_preferences')
    .upsert(
      {
        profile_id: userId,
        sleep_schedule: data.sleepSchedule || null,
        cleanliness_level: data.cleanlinessLevel || null,
        guest_policy: data.guestPolicy || null,
        study_habitat: data.studyHabitat || null,
        personality_vibe: data.personalityVibe || null,
        smoker_allowed: data.smokerAllowed ?? false,
        religion_preference: data.religionPreference || 'any',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id' },
    );

  if (rpError) throw rpError;
}
