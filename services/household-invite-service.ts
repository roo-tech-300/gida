import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { buildInviteUrl } from '@/utils/invite-link';
import { parseInvitePage, parseSeats, type HouseholdSeats, type InvitePage } from '@/utils/invite-parse';

export type CreatedInvite = { id: string; token: string; url: string; seatHeldUntil: string; expiresAt: string };
export type JoinedInvite = { creditId: string; podId: string };

function inviteOrigin(): string | undefined {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.origin) return window.location.origin;
  return process.env.EXPO_PUBLIC_PAY_PAGE_ORIGIN;
}

/** The public page behind a link. Works without an account. */
export async function fetchInvitePage(token: string): Promise<InvitePage> {
  const { data, error } = await supabase.rpc('get_household_invite', { p_token: token });
  if (error) {
    console.error('[HouseholdInvite] Could not load the invite page:', error.message);
    throw new Error('We could not open this invite. Please check your connection and try again.');
  }
  return parseInvitePage(data);
}

/** Founder: a one-use link that holds a seat for two hours. */
export async function createHouseholdInvite(podId: string): Promise<CreatedInvite> {
  const { data, error } = await supabase.rpc('create_household_invite', { p_pod_id: podId });
  if (error) {
    console.error('[HouseholdInvite] Could not create an invite:', error.message);
    throw new Error(error.message || 'Could not create an invite link.');
  }
  const row = (data ?? {}) as { id?: string; token?: string; seatHeldUntil?: string; expiresAt?: string };
  if (!row.id || !row.token || !row.seatHeldUntil || !row.expiresAt) throw new Error('Could not create an invite link.');
  return { id: row.id, token: row.token, url: buildInviteUrl(inviteOrigin(), row.token), seatHeldUntil: row.seatHeldUntil, expiresAt: row.expiresAt };
}

/** Friend: take the seat. Throws the database's reason in plain words when it refuses. */
export async function joinHouseholdInvite(token: string): Promise<JoinedInvite> {
  const { data, error } = await supabase.rpc('join_household_invite', { p_token: token });
  if (error) {
    console.error('[HouseholdInvite] Could not join by invite:', error.message);
    throw new Error(error.message || 'Could not join this household.');
  }
  const row = (data ?? {}) as { creditId?: string; podId?: string };
  if (!row.creditId || !row.podId) throw new Error('Could not join this household.');
  return { creditId: row.creditId, podId: row.podId };
}

export async function revokeHouseholdInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_household_invite', { p_invite_id: inviteId });
  if (error) {
    console.error('[HouseholdInvite] Could not cancel the invite:', error.message);
    throw new Error('Could not cancel that link. Please try again.');
  }
}

/** Founder: who is in the household and which links are out. */
export async function fetchHouseholdSeats(podId: string): Promise<HouseholdSeats> {
  const { data, error } = await supabase.rpc('get_household_seats', { p_pod_id: podId });
  if (error) {
    console.error('[HouseholdInvite] Could not load the seats:', error.message);
    throw new Error('We could not load your household. Please try again.');
  }
  return parseSeats(data);
}

/** The link for an existing invite, built the same way as a fresh one. */
export function inviteUrlFor(token: string): string {
  return buildInviteUrl(inviteOrigin(), token);
}
