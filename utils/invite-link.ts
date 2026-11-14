const TOKEN_PATTERN = /^[0-9a-f]{32}$/;
const DEFAULT_ORIGIN = 'https://gida.apartments';

/** Invite tokens are 32 hex characters; anything else is a mistyped or cut-off link. */
export function isValidInviteToken(value: string | undefined | null): value is string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value);
}

/** The shareable page for a seat: where a friend lands without an account. */
export function buildInviteUrl(origin: string | undefined, token: string): string {
  const base = (origin && origin.trim() ? origin.trim() : DEFAULT_ORIGIN).replace(/\/+$/, '');
  return `${base}/join/${token}`;
}

/** WhatsApp-ready message for a seat link. */
export function inviteMessage(placeTitle: string, url: string, senderFirstName?: string | null): string {
  const who = senderFirstName ? `${senderFirstName} here. ` : '';
  return `${who}I'm getting a place at ${placeTitle} on Gida. Join me and pay your share here: ${url}`;
}
