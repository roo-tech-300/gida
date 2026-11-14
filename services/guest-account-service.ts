import { supabase } from '@/lib/supabase';
import { randomPassword, usernameFromEmail, type GuestDetails } from '@/utils/guest-details';

export type GuestAccountResult =
  | { status: 'ready' }
  /** The project requires email confirmation before a session exists. */
  | { status: 'needs_confirmation' }
  /** The email already belongs to an account, so the student should sign in instead. */
  | { status: 'email_taken' };

/**
 * Creates the account a friend needs to pay, from their email alone. The password is a throwaway they
 * never see: they set a real one later from My Home. The profile is marked onboarded so they are not
 * sent through onboarding before paying.
 */
export async function createGuestAccount(details: GuestDetails): Promise<GuestAccountResult> {
  const email = details.email.trim().toLowerCase();
  const name = details.name.trim().replace(/\s+/g, ' ');
  const { data, error } = await supabase.auth.signUp({
    email,
    password: randomPassword(),
    options: { data: { full_name: name, needs_password: true } },
  });

  if (error) {
    const text = error.message.toLowerCase();
    if (text.includes('already') && text.includes('registered')) return { status: 'email_taken' };
    console.error('[GuestAccount] Sign-up failed:', error.message);
    throw new Error('We could not create your account. Please check your email address and try again.');
  }
  // Supabase hides an existing account behind a fake user with no identities.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) return { status: 'email_taken' };
  if (!data.session || !data.user) return { status: 'needs_confirmation' };

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: name,
      gender: details.gender,
      school: details.school.trim(),
      username: usernameFromEmail(email),
      is_student: true,
      onboarded: true,
    })
    .eq('id', data.user.id);
  if (profileError) {
    console.error('[GuestAccount] Could not save the profile:', profileError.message);
    throw new Error('Your account was created, but we could not save your details. Please try again.');
  }
  return { status: 'ready' };
}

/** Sets the real password and clears the "needs a password" reminder. */
export async function setAccountPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password, data: { needs_password: false } });
  if (error) {
    console.error('[GuestAccount] Could not set the password:', error.message);
    throw new Error(error.message || 'Could not set your password. Please try again.');
  }
}
