import { supabase } from '@/lib/supabase';
import type { OnboardingData } from '@/types/onboarding';

export type UsernameValidation = {
  valid: boolean;
  reason?: 'empty' | 'format' | 'taken';
};

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .replace(/^[._]+/, '')
    .slice(0, 30);
}

export function validateUsernameFormat(username: string): UsernameValidation {
  if (!username) return { valid: false, reason: 'empty' };
  if (!/^[a-z0-9][a-z0-9._]{2,29}$/.test(username)) {
    return { valid: false, reason: 'format' };
  }
  return { valid: true };
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  if (normalized.length < 3) return false;
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalized)
    .maybeSingle();
  if (error) {
    console.error('[UsernameService] Availability check failed:', error);
    return true;
  }
  return !data;
}

type PrefillResult = Partial<OnboardingData>;

export async function loadOnboardingPrefill(userId: string): Promise<PrefillResult> {
  const prefill: PrefillResult = {};

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('gender')
      .eq('id', userId)
      .maybeSingle();
    if (!profileError && profile?.gender) {
      prefill.gender = profile.gender as OnboardingData['gender'];
    }

    const { data: living, error: livingError } = await supabase
      .from('living_preferences')
      .select('min_budget, max_budget, preferred_area, preferred_layout, must_have_amenities')
      .eq('profile_id', userId)
      .maybeSingle();
    if (!livingError && living) {
      if (living.min_budget != null) prefill.minBudget = String(living.min_budget);
      if (living.max_budget != null) prefill.maxBudget = String(living.max_budget);
      if (living.preferred_area) prefill.preferredArea = living.preferred_area;
      if (living.preferred_layout) prefill.preferredLayout = living.preferred_layout as OnboardingData['preferredLayout'];
      if (Array.isArray(living.must_have_amenities) && living.must_have_amenities.length > 0) {
        prefill.mustHaveAmenities = living.must_have_amenities as OnboardingData['mustHaveAmenities'];
      }
    }
  } catch (error) {
    console.error('[UsernameService] Prefill load failed:', error);
  }

  return prefill;
}

export async function suggestUsername(fullName: string | null | undefined, userId: string): Promise<string> {
  const base = (fullName ?? 'user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 16);
  let candidate = base || 'user';
  if (!(await isUsernameAvailable(candidate))) {
    candidate = `${base || 'user'}.${userId.slice(0, 4)}`;
  }
  return candidate;
}
