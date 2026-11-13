import type { Pod } from '@/types/liquidity';
import type { ManageGroupMember } from '@/types/group-member';
import { memberPaymentStatus } from '@/utils/liquidity-math';

/** Maps a pod's members to the rows shown in the household list and manage-group modal. */
export function toGroupMembers(pod: Pod | undefined, currentUserId: string | undefined): ManageGroupMember[] {
  return (pod?.members ?? []).map((member) => {
    const isInvitation = member.slot_credit_id === 'invitation';
    const status: ManageGroupMember['status'] =
      member.user_id === currentUserId ? 'you' : isInvitation ? 'pending' : memberPaymentStatus(member);
    return {
      id: member.user_id,
      name: member.profile?.full_name || member.full_name || 'Roommate',
      status,
      via: isInvitation ? 'code' : 'direct',
      avatar_url: member.profile?.avatar_url ?? member.avatar_url,
    };
  });
}
