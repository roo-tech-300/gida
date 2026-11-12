import { useLocalSearchParams } from 'expo-router';

import { ParentPayScreen } from '@/components/pay/parent-pay-screen';
import { PayMessageState } from '@/components/pay/pay-message-state';
import { isValidPayToken } from '@/utils/payment-link';

/** Public route: a parent opens this from a message. No sign-in. See AuthGate for the allow-list. */
export default function PayRoute() {
  const { token, reference } = useLocalSearchParams<{ token: string; reference?: string }>();

  if (!isValidPayToken(token)) {
    return <PayMessageState tone="danger" icon="link-outline" title="This link is not valid" body="It may have been copied incompletely. Ask the student to send it again." />;
  }
  return <ParentPayScreen token={token} reference={reference} />;
}
