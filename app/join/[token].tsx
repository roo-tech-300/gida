import { useLocalSearchParams } from 'expo-router';

import { InviteProblemCard } from '@/components/invite/invite-problem-card';
import { JoinScreen } from '@/components/invite/join-screen';
import { isValidInviteToken } from '@/utils/invite-link';
import { inviteProblem } from '@/utils/invite-state';

/** Public route: a friend opens this from a message. No sign-in needed. See AuthGate for the allow-list. */
export default function JoinRoute() {
  const { token } = useLocalSearchParams<{ token: string }>();
  if (!isValidInviteToken(token)) {
    const problem = inviteProblem('not_found');
    return problem ? <InviteProblemCard problem={problem} onAction={() => undefined} /> : null;
  }
  return <JoinScreen token={token} />;
}
