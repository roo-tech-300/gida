export type WaitTone = 'ok' | 'warn' | 'late';

export interface Waiting {
  label: string;
  tone: WaitTone;
}

const MINUTE_MS = 60_000;
const WARN_AFTER_MIN = 60;
const LATE_AFTER_MIN = 240;

/** How long a student has been waiting. Green under 1h, amber under 4h, red after. */
export function waitingSince(createdAtIso: string, now: number): Waiting {
  const minutes = Math.max(0, Math.floor((now - new Date(createdAtIso).getTime()) / MINUTE_MS));
  const tone: WaitTone = minutes < WARN_AFTER_MIN ? 'ok' : minutes < LATE_AFTER_MIN ? 'warn' : 'late';

  if (minutes < 1) return { label: 'Just now', tone };
  if (minutes < 60) return { label: `${minutes}m`, tone };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { label: `${hours}h ${minutes % 60}m`, tone };
  return { label: `${Math.floor(hours / 24)}d ${hours % 24}h`, tone };
}
