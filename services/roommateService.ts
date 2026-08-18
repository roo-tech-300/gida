import { supabase } from '@/lib/supabase';
import { calculateAge, calculateStudentLevel } from '@/utils/academicLevel';
import type { LifestyleChip, RoommateProfile } from '@/types/roommates';

export type DbRoommateRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  birth_year: number | null;
  entry_year: number | null;
  program_duration: number | null;
  bio: string | null;
  school: string | null;
  religion: string | null;
  roommate_preferences: {
    sleep_schedule: string | null;
    cleanliness_level: string | null;
    guest_policy: string | null;
    study_habitat: string | null;
    personality_vibe: string | null;
    smoker_allowed: boolean | null;
  } | null;
  living_preferences: {
    max_budget: number | null;
    preferred_area: string | null;
  } | null;
};

export type MyPreferences = {
  roommate: DbRoommateRow['roommate_preferences'];
  living: DbRoommateRow['living_preferences'];
};

function formatBudget(amount: number | null): string {
  if (!amount) return 'Flexible';
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M/yr`;
  if (amount >= 1_000) return `₦${Math.round(amount / 1_000)}k/yr`;
  return `₦${amount}/yr`;
}

export function buildChips(prefs: DbRoommateRow['roommate_preferences']): LifestyleChip[] {
  if (!prefs) return [];
  const chips: LifestyleChip[] = [];
  if (prefs.cleanliness_level) chips.push({ label: 'Clean', value: prefs.cleanliness_level });
  if (prefs.personality_vibe) chips.push({ label: 'Vibe', value: prefs.personality_vibe });
  if (prefs.study_habitat) chips.push({ label: 'Study', value: prefs.study_habitat });
  if (prefs.guest_policy) chips.push({ label: 'Guests', value: prefs.guest_policy });
  if (prefs.sleep_schedule) chips.push({ label: 'Sleep', value: prefs.sleep_schedule });
  return chips;
}

export function mapRowToProfile(row: DbRoommateRow): RoommateProfile {
  return {
    id: row.id,
    name: row.full_name || 'Anonymous',
    age: calculateAge(row.birth_year ?? undefined) || 20,
    avatar: row.avatar_url ? { uri: row.avatar_url } : null,
    university: row.school || 'FUT Minna',
    level: calculateStudentLevel({
      entryYear: row.entry_year ?? undefined,
      programDuration: row.program_duration ?? undefined,
    }),
    compatibility: 0,
    moveInDate: 'Flexible',
    budget: formatBudget(row.living_preferences?.max_budget ?? null),
    bio: row.bio || 'No bio yet',
    chips: buildChips(row.roommate_preferences),
    preferredArea: row.living_preferences?.preferred_area ?? undefined,
    maxBudget: row.living_preferences?.max_budget ?? undefined,
    religion: row.religion ?? undefined,
    smokerAllowed: row.roommate_preferences?.smoker_allowed ?? undefined,
  };
}

export async function fetchRoommates(): Promise<RoommateProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, roommate_preferences(*), living_preferences(*)')
    .eq('show_in_roommate_feed', true)
    .eq('onboarded', true)
    .order('full_name');

  if (error) throw error;

  return (data || []).map(mapRowToProfile);
}

export async function fetchRoommateById(id: string): Promise<RoommateProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, roommate_preferences(*), living_preferences(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[RoommateService] Failed to fetch roommate:', error.message);
    return null;
  }

  return mapRowToProfile(data);
}

export async function fetchMyRoommatePreferences(userId: string): Promise<MyPreferences | null> {
  const { data: roommate, error: roommateError } = await supabase
    .from('roommate_preferences')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle();

  if (roommateError) {
    console.error('[RoommateService] Failed to fetch my roommate preferences:', roommateError.message);
  }

  const { data: living, error: livingError } = await supabase
    .from('living_preferences')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle();

  if (livingError) {
    console.error('[RoommateService] Failed to fetch my living preferences:', livingError.message);
  }

  return { roommate, living };
}
