import { Text } from 'react-native';

import { ClaimReview } from '@/components/claim/claim-review';
import type { SelectedFriend } from '@/components/claim/friend-picker';
import { styles } from './claim-room-modal.styles';

type Props = {
  isBuyout: boolean;
  listingTitle: string;
  listingPriceLabel: string;
  listingImage?: string;
  friendsCount: number;
  codeSeats: number;
  matchedCount: number;
  code: string;
  roster: SelectedFriend[];
  baseRent: number;
  platformFee: number;
  totalCost: number;
};

export function ClaimReviewStep({
  isBuyout,
  listingTitle,
  listingPriceLabel,
  listingImage,
  friendsCount,
  codeSeats,
  matchedCount,
  code,
  roster,
  baseRent,
  platformFee,
  totalCost,
}: Props) {
  return (
    <>
      <Text style={styles.title}>{isBuyout ? 'Your private place' : 'Review & reserve'}</Text>
      <Text style={styles.subtitle}>
        {isBuyout ? 'You get the entire property to yourself.' : 'Lock in your group before paying.'}
      </Text>
      <ClaimReview
        listingTitle={listingTitle}
        listingPriceLabel={listingPriceLabel}
        listingImage={listingImage}
        friendsCount={friendsCount}
        codeSeats={codeSeats}
        matchedCount={matchedCount}
        code={code}
        roster={roster}
        baseRent={baseRent}
        platformFee={platformFee}
        totalCost={totalCost}
      />
    </>
  );
}
