/**
 * Seeds activity on top of the catalog: households (pods, reservations, members,
 * invites), chats with app-shaped attachments, tours, reviews and saved listings.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  SEED_CONVERSATIONS, SEED_HOUSEHOLDS, SEED_REVIEWS, SEED_SAVED, SEED_TOURS,
  type SeedMessage,
} from '../../dummy/local-seed-data.ts';
import type { MessageAttachment } from '../../types/messages.ts';
import type { Catalog, SeededListing } from './seed-local-catalog.ts';
import { hoursFromNow, localDate, must, naira } from './seed-local-helpers.ts';

interface SeededHousehold {
  podId: string;
  listingKey: string;
  creditByUser: Map<string, string>;
}

const UNREAD_WITHIN_MINUTES = 300;

function listingOf(catalog: Catalog, key: string): SeededListing {
  const l = catalog.listings.get(key);
  if (!l) throw new Error(`[Seed] unknown listing "${key}"`);
  return l;
}

function userOf(catalog: Catalog, key: string): string {
  const id = catalog.users.get(key);
  if (!id) throw new Error(`[Seed] unknown user "${key}"`);
  return id;
}

export async function seedHouseholds(db: SupabaseClient, catalog: Catalog): Promise<Map<string, SeededHousehold>> {
  const out = new Map<string, SeededHousehold>();
  for (const h of SEED_HOUSEHOLDS) {
    const listing = listingOf(catalog, h.listing);
    const share = Math.round(listing.priceTotal / h.targetOccupancy);
    const oldest = Math.max(...h.members.map((m) => m.createdHoursAgo));
    const pod = must(`pod ${h.key}`, await db.from('pods').insert({
      estate_id: listing.estateId, listing_id: listing.id, property_tier: listing.propertyTier,
      matched_gender: h.gender, current_total_intent: h.members.length, target_occupancy: h.targetOccupancy,
      group_code: h.groupCode, founder_user_id: userOf(catalog, h.members[0].user),
      verification_status: h.verification, created_at: hoursFromNow(-oldest),
      verified_at: h.verification === 'approved' ? hoursFromNow(-oldest + 0.5) : null,
    }).select('id').single());

    const creditByUser = new Map<string, string>();
    for (const [i, m] of h.members.entries()) {
      const paid = m.status === 'paid_unmatched';
      const credit = must(`credit ${h.key}/${m.user}`, await db.from('slot_credits').insert({
        user_id: userOf(catalog, m.user), estate_id: listing.estateId, listing_id: listing.id,
        property_tier: listing.propertyTier, intent_size: 1, target_occupancy: h.targetOccupancy,
        status: m.status, invite_code: `${h.groupCode}${i + 1}`, amount_paid: share,
        created_at: hoursFromNow(-m.createdHoursAgo), payment_deadline: hoursFromNow(h.holdEndsInHours),
        paid_at: paid ? hoursFromNow(-m.createdHoursAgo + 2) : null,
        expired_at: m.status === 'expired' ? hoursFromNow(h.holdEndsInHours) : null,
      }).select('id').single());
      creditByUser.set(m.user, credit.id as string);
      must(`member ${h.key}/${m.user}`, await db.from('pod_members').insert({
        pod_id: pod.id, user_id: userOf(catalog, m.user), slot_credit_id: credit.id, intent_size: 1,
        amount_paid: share, created_at: hoursFromNow(-m.createdHoursAgo),
      }).select('id'));
    }

    if (h.invite) {
      const invitee = inviteeName(catalog, h.invite.invitee);
      must(`invite ${h.key}`, await db.from('pod_invitations').insert({
        pod_id: pod.id, inviter_user_id: userOf(catalog, h.invite.inviter),
        invitee_user_id: userOf(catalog, h.invite.invitee), invitee_name: invitee, status: 'pending',
      }).select('id'));
    }
    out.set(h.key, { podId: pod.id as string, listingKey: h.listing, creditByUser });
  }
  return out;
}

function inviteeName(catalog: Catalog, key: string): string {
  return catalog.userNames.get(key) ?? key;
}

function buildAttachment(
  msg: SeedMessage, catalog: Catalog, household: SeededHousehold | undefined, applicant: string,
): MessageAttachment | null {
  if (!msg.attachment) return null;
  if (typeof msg.attachment === 'object') {
    const l = listingOf(catalog, msg.attachment.listing);
    return { type: 'listing', listingId: l.id, title: l.title, image: l.image, price: `${naira(l.priceTotal)}/year`, location: l.location };
  }
  if (!household) throw new Error('[Seed] reservation/decision attachment needs a household');
  const l = listingOf(catalog, household.listingKey);
  if (msg.attachment === 'reservation') {
    return {
      type: 'lodge_reservation', podId: household.podId, listingId: l.id, creditId: household.creditByUser.get(applicant) ?? '',
      title: l.title, image: l.image, location: l.location, userName: catalog.userNames.get(applicant) ?? 'A resident',
    };
  }
  return { type: 'lodge_decision', podId: household.podId, listingId: l.id, title: l.title, image: l.image, decision: 'accepted' };
}

export async function seedConversations(db: SupabaseClient, catalog: Catalog, households: Map<string, SeededHousehold>): Promise<void> {
  for (const c of SEED_CONVERSATIONS) {
    const [x, y] = c.between.map((k) => userOf(catalog, k));
    const [a, b] = x < y ? [x, y] : [y, x];
    const conv = must(`conversation ${c.between.join('-')}`, await db.from('conversations').insert({ participant_a: a, participant_b: b }).select('id').single());
    const household = c.household ? households.get(c.household) : undefined;
    const applicant = c.between[0];

    const unread = { a: 0, b: 0 };
    for (const m of c.messages) {
      const sender = userOf(catalog, m.from);
      const at = Date.now() - m.minutesAgo * 60_000;
      const isUnread = m.minutesAgo <= UNREAD_WITHIN_MINUTES;
      if (isUnread) unread[sender === a ? 'b' : 'a'] += 1;
      must(`message ${c.between.join('-')}`, await db.from('messages').insert({
        conversation_id: conv.id, sender_id: sender, body: m.body, client_sent_at: at,
        created_at: new Date(at).toISOString(), read_at: isUnread ? null : new Date(at + 60_000).toISOString(),
        attachment: buildAttachment(m, catalog, household, applicant),
      }).select('id'));
    }
    const last = c.messages[c.messages.length - 1];
    must(`conversation summary ${c.between.join('-')}`, await db.from('conversations').update({
      last_message_at: new Date(Date.now() - last.minutesAgo * 60_000).toISOString(),
      last_message_preview: last.body, last_message_sender_id: userOf(catalog, last.from),
      unread_a: unread.a, unread_b: unread.b,
    }).eq('id', conv.id).select('id'));
  }
}

export async function seedExtras(db: SupabaseClient, catalog: Catalog, households: Map<string, SeededHousehold>): Promise<void> {
  for (const t of SEED_TOURS) {
    must(`tour ${t.user}/${t.listing}`, await db.from('tour_bookings').insert({
      user_id: userOf(catalog, t.user), listing_id: listingOf(catalog, t.listing).id, admin_id: userOf(catalog, t.admin),
      scheduled_date: localDate(t.dayOffset), scheduled_time: t.time, status: t.status,
    }).select('id'));
  }
  for (const r of SEED_REVIEWS) {
    const slot = [...households.values()].find((h) => h.listingKey === r.listing)?.creditByUser.get(r.user) ?? null;
    const { error } = await db.from('reviews').insert({
      listing_id: listingOf(catalog, r.listing).id, user_id: userOf(catalog, r.user), slot_id: slot,
      rating: r.rating, text: r.text, anonymous: false, review_number: 1,
    });
    if (error) console.error(`[Seed] review ${r.user}/${r.listing} skipped:`, error.message);
  }
  must('saved listings', await db.from('saved_listings').insert(
    SEED_SAVED.map((s) => ({ user_id: userOf(catalog, s.user), listing_id: listingOf(catalog, s.listing).id, type: 'lodge' })),
  ).select('id'));
}
