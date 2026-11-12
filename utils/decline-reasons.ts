export interface DeclineReason {
  key: string;
  /** Short chip text for the admin. */
  label: string;
  /** Sentence the student reads, written kindly. */
  message: string;
}

export const DECLINE_REASONS: readonly DeclineReason[] = [
  { key: 'full', label: 'Household already full', message: 'This household is already full.' },
  { key: 'gender', label: 'Wrong gender for this lodge', message: 'This lodge is set aside for a different group.' },
  { key: 'unavailable', label: 'No longer available', message: 'This place is no longer available.' },
  { key: 'profile', label: 'Profile incomplete', message: 'Your profile needs a few more details before we can approve this.' },
  { key: 'other', label: 'Other', message: '' },
];

export const OTHER_REASON_KEY = 'other';

/** What gets saved and shown to the student: the chip's sentence plus the admin's note. */
export function composeDeclineReason(key: string | null, note: string): string {
  const reason = DECLINE_REASONS.find((r) => r.key === key);
  const parts = [reason?.message ?? '', note.trim()].filter(Boolean).map(endSentence);
  return parts.join(' ');
}

function endSentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/** "Other" needs a note, and every decline needs something to tell the student. */
export function canSubmitDecline(key: string | null, note: string): boolean {
  if (!key) return false;
  return composeDeclineReason(key, note).length > 0;
}
