import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import type { OnboardingData } from '@/types/onboarding';

export type ProfileRecord = {
  id: string;
  full_name?: string | null;
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
  if (profile.onboarded) return true;
  return Boolean(profile.city?.trim());
}

export async function saveOnboardingProfile(userId: string, data: OnboardingData) {
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      city: 'Minna',
      is_student: true,
      school: 'Federal University of Technology, Minna (FUT Minna)',
      onboarded: true,
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const budget = data.maxBudget ? parseFloat(data.maxBudget) : null;

  const { error: livingError } = await supabase.from('living_preferences').upsert(
    {
      profile_id: userId,
      max_budget: budget,
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

const AVATAR_BUCKET = 'avatars';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function getContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  return 'image/jpeg';
}

export async function uploadAvatar(
  userId: string,
  localUri: string,
): Promise<string> {
  const filePath = `${userId}/avatar.jpg`;
  const contentType = getContentType(localUri);
  const base64Data = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const fileBuffer = base64ToArrayBuffer(base64Data);

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, fileBuffer, { contentType, upsert: true });

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

  return publicUrl;
}
