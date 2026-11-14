export type Gender = 'MALE' | 'FEMALE';

export type GuestDetails = { name: string; email: string; gender: Gender | null; school: string };

export type GuestErrors = Partial<Record<keyof GuestDetails, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The four details that hold a seat. Anything else about the student can wait until after they pay. */
export function validateGuestDetails(details: GuestDetails): GuestErrors {
  const errors: GuestErrors = {};
  if (details.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = 'Please enter your first and last name.';
  if (!EMAIL.test(details.email.trim())) errors.email = 'Enter an email address we can reach you on.';
  if (details.gender === null) errors.gender = 'Choose one so we can place you in the right household.';
  if (details.school.trim().length < 2) errors.school = 'Tell us which school you attend.';
  return errors;
}

/** A throwaway password for the account the student has not chosen one for yet. It is never shown; they set their own later. */
export function randomPassword(length = 24): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  const webCrypto = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (webCrypto?.getRandomValues) webCrypto.getRandomValues(bytes);
  else for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** A readable, unique-enough username from an email, e.g. kemi.danjuma@x.com -> kemi_danjuma482. */
export function usernameFromEmail(email: string, suffix: number = Math.floor(100 + Math.random() * 900)): string {
  const local = email.split('@')[0] ?? '';
  const cleaned = local.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20) || 'student';
  return `${cleaned}${suffix}`;
}

const MIN_PASSWORD = 8;

/** Checks the password a friend chooses after paying. Returns a message, or null when it is fine. */
export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (password !== confirm) return 'The two passwords do not match.';
  return null;
}
