/**
 * Pre-launch gating.
 *
 * Keep the full app available on the production development branch.
 * The dev-and-builds branch carries the public waitlist gate.
 *
 * Also controls the Android APK button on the web landing iframe
 * (`app/index.web.tsx` passes `?launched=` into `public/landing/index.html`).
 */
export const IS_APP_LAUNCHED = true;

export const WAITLIST_WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbDnkybJ3jv4GFfvfZ2u';
