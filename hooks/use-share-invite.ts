import { useCallback } from 'react';
import { Share } from 'react-native';

import { useAppToast } from '@/components/ui/toast-card';
import { copyTextToClipboard } from '@/utils/clipboard';
import { inviteMessage } from '@/utils/invite-link';

/** Opens the phone's share sheet with the invite message; where there is none (some browsers), copies the link. */
export function useShareInvite(placeTitle: string, senderFirstName?: string | null) {
  const { showToast } = useAppToast();

  const copy = useCallback(async (url: string) => {
    const copied = await copyTextToClipboard(url);
    showToast({ message: copied ? 'Link copied. Paste it in a message to your friend.' : `Share this link: ${url}`, type: 'success' });
  }, [showToast]);

  const share = useCallback(async (url: string) => {
    try {
      await Share.share({ message: inviteMessage(placeTitle, url, senderFirstName) });
    } catch (error) {
      console.error('[ShareInvite] Share sheet unavailable, copying instead:', error);
      await copy(url);
    }
  }, [placeTitle, senderFirstName, copy]);

  return { share, copy };
}
