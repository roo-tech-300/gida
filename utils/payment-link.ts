const TOKEN_PATTERN = /^[0-9a-f]{32}$/;
const DEFAULT_ORIGIN = 'https://gida.apartments';

export function isValidPayToken(value: string | undefined): value is string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value);
}

export function buildPayUrl(origin: string | undefined, token: string): string {
  const base = (origin && origin.length > 0 ? origin : DEFAULT_ORIGIN).replace(/\/$/, '');
  return `${base}/pay/${token}`;
}

export function firstName(fullName: string | null | undefined): string {
  return (fullName ?? '').trim().split(/\s+/)[0] ?? '';
}

type ShareMessageInput = {
  studentName: string;
  amountLabel: string;
  placeTitle: string | null | undefined;
  url: string;
};

/** The text a student sends to a parent. Plain and specific so a parent trusts the link. */
export function buildShareMessage({ studentName, amountLabel, placeTitle, url }: ShareMessageInput): string {
  const who = studentName ? `${studentName} has` : 'Your child has';
  const place = placeTitle ? ` at ${placeTitle}` : '';
  return `${who} reserved a spot${place} on Gida. You can pay ${amountLabel} securely here: ${url}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}
