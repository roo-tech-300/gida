import { supabase } from '@/lib/supabase';
import { calculateAge, calculateStudentLevel } from '@/utils/academicLevel';
import type { LifestyleChip, RoommateProfile } from '@/types/roommates';

type DbRoommateRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  birth_year: number | null;
  entry_year: number | null;
  program_duration: number | null;
  bio: string | null;
  school: string | null;
  roommate_preferences: {
    sleep_schedule: string | null;
    cleanliness_level: string | null;
    guest_policy: string | null;
    study_habitat: string | null;
    personality_vibe: string | null;
  } | null;
  living_preferences: {
    max_budget: number | null;
    preferred_area: string | null;
  } | null;
};

function formatBudget(amount: number | null): string {
  if (!amount) return 'Flexible';
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M/yr`;
  if (amount >= 1_000) return `₦${Math.round(amount / 1_000)}k/yr`;
  return `₦${amount}/yr`;
}

function buildChips(prefs: DbRoommateRow['roommate_preferences']): LifestyleChip[] {
  if (!prefs) return [];
  const chips: LifestyleChip[] = [];
  if (prefs.cleanliness_level) chips.push({ label: 'Clean', value: prefs.cleanliness_level });
  if (prefs.personality_vibe) chips.push({ label: 'Vibe', value: prefs.personality_vibe });
  if (prefs.study_habitat) chips.push({ label: 'Study', value: prefs.study_habitat });
  if (prefs.guest_policy) chips.push({ label: 'Guests', value: prefs.guest_policy });
  if (prefs.sleep_schedule) chips.push({ label: 'Sleep', value: prefs.sleep_schedule });
  return chips;
}

function mapRowToProfile(row: DbRoommateRow): RoommateProfile {
  return {
    id: row.id,
    name: row.full_name || 'Anonymous',
    age: calculateAge(row.birth_year ?? undefined) || 20,
    avatar: row.avatar_url ?? null,
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
