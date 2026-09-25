/**
 * Pre-launch gating.
 *
 * Flip IS_APP_LAUNCHED to true when Gida is ready for real signups.
 * While false, the landing CTA and the entire (auth) group redirect to
 * the coming-soon / waitlist screen instead of letting anyone sign up.
 */
export const IS_APP_LAUNCHED = false;

export const WAITLIST_WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbDnkybJ3jv4GFfvfZ2u';
