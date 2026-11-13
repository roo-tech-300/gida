import type { Pod, PodMember } from '@/types/liquidity';
import { toGroupMembers } from './group-members';

function member(overrides: Partial<PodMember>): PodMember {
  return {
    user_id: 'u', full_name: 'Plain Name', intent_size: 1, campus: '', major: '', cleanliness_score: 0,
    sleep_schedule: '', slot_credit_id: 'credit-1', ...overrides,
  };
}

const pod = { id: 'p1', members: [
  member({ user_id: 'me', full_name: 'Me' }),
  member({ user_id: 'inv', slot_credit_id: 'invitation', full_name: '' }),
  member({ user_id: 'paid', credit_status: 'matched', profile: { full_name: 'Profile Name', avatar_url: 'a.jpg' } }),
] } as unknown as Pod;

describe('toGroupMembers', () => {
  it('returns an empty list without a pod', () => {
    expect(toGroupMembers(undefined, 'me')).toEqual([]);
  });

  it('marks the current user, invitations and paid members', () => {
    const rows = toGroupMembers(pod, 'me');
    expect(rows.map((r) => [r.id, r.status, r.via])).toEqual([
      ['me', 'you', 'direct'],
      ['inv', 'pending', 'code'],
      ['paid', 'paid', 'direct'],
    ]);
  });

  it('prefers the profile name and avatar, with a fallback name', () => {
    const rows = toGroupMembers(pod, 'me');
    expect(rows[2]).toMatchObject({ name: 'Profile Name', avatar_url: 'a.jpg' });
    expect(rows[1].name).toBe('Roommate');
  });
});
