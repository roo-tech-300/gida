import { supabase } from '@/lib/supabase';

export const PHONE_NUMBER_REQUIRED_MESSAGE = 'Add your phone number before booking a lodge or joining a pod.';

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Please sign in to continue.');
  return data.user;
}

export async function getMyPhoneNumber(): Promise<string | null> {
  const user = await currentUser();
  const { data, error } = await supabase
    .from('profiles')
    .select('phone_number')
    .eq('id', user.id)
    .maybeSingle();
  if (error) {
    console.error('[PhoneNumber] Failed to read saved phone number:', error.message);
    throw new Error('Could not check your saved phone number. Please try again.');
  }
  const savedPhone = data?.phone_number?.trim();
  if (savedPhone) return savedPhone;
  if (!user.phone) return null;

  const phoneNumber = normalizePhoneNumber(user.phone);
  const { error: saveError } = await supabase
    .from('profiles')
    .update({ phone_number: phoneNumber })
    .eq('id', user.id);
  if (saveError) {
    console.error('[PhoneNumber] Failed to copy account phone into the profile:', saveError.message);
    throw new Error('Could not prepare your saved account phone number. Please try again.');
  }
  return phoneNumber;
}

export async function assertPhoneNumberOnFile(userId?: string): Promise<void> {
  const resolvedUserId = userId ?? (await currentUser()).id;
  const { data, error } = await supabase
    .from('profiles')
    .select('phone_number')
    .eq('id', resolvedUserId)
    .maybeSingle();
  if (error) {
    console.error('[PhoneNumber] Booking phone check failed:', error.message);
    throw new Error('Could not verify your phone number. Please try again.');
  }
  if (!data?.phone_number?.trim()) throw new Error(PHONE_NUMBER_REQUIRED_MESSAGE);
}

export function normalizePhoneNumber(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  let normalized: string;
  if (trimmed.startsWith('+')) normalized = `+${digits}`;
  else if (digits.startsWith('00')) normalized = `+${digits.slice(2)}`;
  else if (digits.startsWith('234')) normalized = `+${digits}`;
  else if (digits.startsWith('0')) normalized = `+234${digits.slice(1)}`;
  else throw new Error('Include your country code, for example +234 801 234 5678.');

  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error('Enter a valid phone number with its country code.');
  }
  return normalized;
}

export async function saveMyPhoneNumber(input: string): Promise<void> {
  const user = await currentUser();
  const phoneNumber = normalizePhoneNumber(input);
  const { error } = await supabase
    .from('profiles')
    .update({ phone_number: phoneNumber })
    .eq('id', user.id);
  if (error) {
    console.error('[PhoneNumber] Failed to save phone number:', error.message);
    throw new Error('Could not save your phone number. Please try again.');
  }
}
