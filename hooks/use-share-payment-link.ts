import { useState } from 'react';
import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { createPaymentLink } from '@/services/payment-link-service';
import { formatNaira } from '@/utils/format-naira';
import { buildShareMessage, firstName } from '@/utils/payment-link';

type ShareTarget = { creditId: string; amount: number; placeTitle: string | null | undefined };

/** "Send to a parent": make the link, then open the phone's share sheet (copy on web without one). */
export function useSharePaymentLink() {
  const { profile } = useAuth();
  const { showToast } = useAppToast();
  const [isSharing, setIsSharing] = useState(false);

  const share = async ({ creditId, amount, placeTitle }: ShareTarget) => {
    setIsSharing(true);
    try {
      const link = await createPaymentLink(creditId);
      const message = buildShareMessage({
        studentName: firstName(profile?.full_name),
        amountLabel: formatNaira(amount),
        placeTitle,
        url: link.url,
      });
      const canNativeShare = Platform.OS !== 'web' || (typeof navigator !== 'undefined' && typeof navigator.share === 'function');
      if (canNativeShare) {
        await Share.share({ message });
      } else {
        await Clipboard.setStringAsync(message);
        showToast({ message: 'Link copied. Paste it into a message to your parent.', type: 'success' });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return; // the person closed the share sheet
      console.error('[SharePaymentLink] Failed to share link:', error);
      const message = error instanceof Error ? error.message : 'Could not create the link. Please try again.';
      showToast({ message, type: 'error' });
    } finally {
      setIsSharing(false);
    }
  };

  return { share, isSharing };
}
