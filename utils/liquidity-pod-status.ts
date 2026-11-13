import type { Pod, SlotCredit } from '@/types/liquidity';

export type PodGender = 'MALE' | 'FEMALE' | 'MIXED' | 'ANY';

export type GenderAwareMember = { user_id: string; profile?: { gender?: 'MALE' | 'FEMALE' | null } | null };
export type GenderAwarePod = { members: GenderAwareMember[] };

export function podEffectiveGender(pod: GenderAwarePod): PodGender {
  const genders = new Set<'MALE' | 'FEMALE'>();
  for (const member of pod.members) {
    if (member.user_id.startsWith('inv-')) continue;
    const gender = member.profile?.gender;
    if (gender === 'MALE' || gender === 'FEMALE') {
      genders.add(gender);
    }
  }
  if (genders.size === 1) return [...genders][0];
  if (genders.size > 1) return 'MIXED';
  return 'ANY';
}

export function isGenderCompatible(podGender: PodGender, myGender?: 'MALE' | 'FEMALE' | null): boolean {
  if (podGender === 'MIXED') return false;
  if (!myGender) return true;
  if (podGender === 'ANY') return true;
  return podGender === myGender;
}

export type OpenSlotStatus = {
  open: boolean;
  occupied: number;
  available: number;
  target: number;
};

export type SlotAwareMember = { slot_credit_id?: string | null };
export type SlotAwarePod = { members?: SlotAwareMember[]; target_occupancy?: number };

export function countRealMembers(pod: SlotAwarePod | undefined): number {
  return (pod?.members ?? []).filter((m) => m.slot_credit_id !== 'invitation').length;
}

export function podOpenSlotStatus(pod: SlotAwarePod): OpenSlotStatus {
  const realMembers = countRealMembers(pod);
  const reservedInvites = (pod.members ?? []).filter((m) => m.slot_credit_id === 'invitation').length;
  const target = pod.target_occupancy ?? 0;
  const occupied = realMembers + reservedInvites;
  const available = Math.max(0, target - occupied);
  return { open: available > 0, occupied, available, target };
}

export function findActivePodForCredit(pods: Pod[] | undefined, credit: SlotCredit | undefined): Pod | undefined {
  if (!pods || pods.length === 0 || !credit) return pods?.[0];
  return pods.find((pod) =>
    pod.members.some((member) => member.slot_credit_id === credit.id),
  ) ?? pods.find((pod) => pod.listing_id === credit.listing_id) ?? pods[0];
}

export const PAID_CREDIT_STATUSES = new Set(['paid_unmatched', 'matched', 'subletting']);

export type MemberPaymentStatus = 'paid' | 'accepted';

/**
 * Decide whether a pod member has actually paid. The truth lives on the linked
 * slot_credit.status (flipped by payment), NOT on amount_paid, which is
 * pre-filled with the member's rent share at reservation time (before payment).
 * An absent/unknown status is treated as NOT paid (fail-safe), never as paid.
 */
export function memberPaymentStatus(member: { credit_status?: string | null; amount_paid?: number }): MemberPaymentStatus {
  if (member.credit_status) return PAID_CREDIT_STATUSES.has(member.credit_status) ? 'paid' : 'accepted';
  return 'accepted';
}
