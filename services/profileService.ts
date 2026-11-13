import { supabase } from '@/lib/supabase';
import { resolveImageArrayBuffer } from '@/utils/image-buffer';
import { compressImage, AVATAR_PRESET } from '@/utils/compress-image';
import type { OnboardingData } from '@/types/onboarding';

export type ProfileRecord = {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
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
  return Boolean(profile.onboarded);
}

export async function saveOnboardingProfile(userId: string, data: OnboardingData) {
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      city: 'Minna',
      gender: data.gender || null,
      username: (data.username && data.username.trim()) || null,
      is_student: true,
      school: 'Federal University of Technology, Minna (FUT Minna)',
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const minBudget = data.minBudget ? parseFloat(data.minBudget) : null;
  const maxBudget = data.maxBudget ? parseFloat(data.maxBudget) : null;

  const { error: livingError } = await supabase.from('living_preferences').upsert(
    {
      profile_id: userId,
      min_budget: minBudget,
      max_budget: maxBudget,
      preferred_area: data.preferredArea.trim() || null,
      preferred_layout: data.preferredLayout,
      must_have_amenities: data.mustHaveAmenities,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' },
  );

  if (livingError) {
    throw new Error(livingError.message);
  }
}

export async function completeOnboardingProfile(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarded: true })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

const AVATAR_BUCKET = 'avatars';

const AVATAR_CACHE_SECONDS = '31536000';

export async function uploadAvatar(
  userId: string,
  localUri: string,
): Promise<string> {
  // A new path per upload: the old one is cached for a year, so overwriting it would show stale avatars.
  const filePath = `${userId}/avatar-${Date.now().toString(36)}.jpg`;
  const compressedUri = await compressImage(localUri, AVATAR_PRESET);
  const fileBuffer = await resolveImageArrayBuffer(compressedUri);

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: 'image/jpeg',
      cacheControl: AVATAR_CACHE_SECONDS,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (dbError) throw dbError;

  await removeOldAvatars(userId, filePath);

  return publicUrl;
}

/** Best-effort cleanup so replaced avatars don't pile up in storage. */
async function removeOldAvatars(userId: string, keepPath: string): Promise<void> {
  try {
    const { data: files, error } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
    if (error) throw error;
    const stale = (files ?? [])
      .map((file) => `${userId}/${file.name}`)
      .filter((path) => path !== keepPath);
    if (stale.length === 0) return;
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove(stale);
    if (removeError) throw removeError;
  } catch (error) {
    console.error('[uploadAvatar] Failed to clean up old avatars:', error);
  }
}
