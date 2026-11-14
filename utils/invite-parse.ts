import type { InviteStatus } from '@/utils/invite-state';

export type InvitePage = {
  status: InviteStatus;
  listingId: string | null;
  title: string;
  location: string;
  image: string | null;
  rent: number;
  /** What this friend will pay. */
  share: number;
  target: number;
  joined: number;
  openSeats: number;
  gender: 'MALE' | 'FEMALE' | 'ANY';
  inviter: string | null;
  members: string[];
  seatHeldUntil: string | null;
  expiresAt: string | null;
};

export type SeatMember = { name: string; isYou: boolean; state: 'paid' | 'review' | 'unpaid'; deadline: string | null };
export type SeatInvite = { id: string; token: string; opened: boolean; held: boolean; seatHeldUntil: string; expiresAt: string };
export type HouseholdSeats = { target: number; members: SeatMember[]; invites: SeatInvite[] };

const STATUSES: readonly InviteStatus[] = ['open', 'expired', 'revoked', 'claimed', 'closed', 'full', 'not_found'];

const asRecord = (value: unknown): Record<string, unknown> => (typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const asString = (value: unknown): string | null => (typeof value === 'string' && value.length > 0 ? value : null);
const asNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
};

/** Reads the public invite page payload. Anything unexpected becomes "not found" rather than a crash. */
export function parseInvitePage(raw: unknown): InvitePage {
  const row = asRecord(raw);
  const status = STATUSES.find((s) => s === row.status) ?? 'not_found';
  const gender = row.gender === 'MALE' || row.gender === 'FEMALE' ? row.gender : 'ANY';
  const members = Array.isArray(row.members) ? row.members.map((m) => asString(asRecord(m).initials) ?? '?') : [];
  return {
    status,
    listingId: asString(row.listingId),
    title: asString(row.title) ?? '',
    location: asString(row.location) ?? '',
    image: asString(row.image),
    rent: asNumber(row.rent),
    share: asNumber(row.share),
    target: asNumber(row.target),
    joined: asNumber(row.joined),
    openSeats: asNumber(row.openSeats),
    gender,
    inviter: asString(row.inviter),
    members,
    seatHeldUntil: asString(row.seatHeldUntil),
    expiresAt: asString(row.expiresAt),
  };
}

/** Reads the founder's seat list. */
export function parseSeats(raw: unknown): HouseholdSeats {
  const row = asRecord(raw);
  const members = (Array.isArray(row.members) ? row.members : []).map((m): SeatMember => {
    const r = asRecord(m);
    const state = r.state === 'paid' || r.state === 'review' ? r.state : 'unpaid';
    return { name: asString(r.name) ?? 'A housemate', isYou: r.isYou === true, state, deadline: asString(r.deadline) };
  });
  const invites = (Array.isArray(row.invites) ? row.invites : []).flatMap((i): SeatInvite[] => {
    const r = asRecord(i);
    const id = asString(r.id);
    const token = asString(r.token);
    const seatHeldUntil = asString(r.seatHeldUntil);
    const expiresAt = asString(r.expiresAt);
    return id && token && seatHeldUntil && expiresAt ? [{ id, token, opened: asString(r.openedAt) !== null, held: r.held === true, seatHeldUntil, expiresAt }] : [];
  });
  return { target: asNumber(row.target), members, invites };
}

/** Initials for an avatar: "Tobi Adeyemi" -> "TA". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}
