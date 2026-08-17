import { useLocalSearchParams } from 'expo-router';

import { PropertyReviewsScreen } from '@/components/property/property-reviews-screen';

export default function PropertyReviewsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PropertyReviewsScreen listingId={id} />;
}
