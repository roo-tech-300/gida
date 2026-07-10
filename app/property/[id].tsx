import { useCallback, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { PropertyDetailsScreen } from '@/components/property/property-details-screen';
import { NetworkErrorScreen } from '@/components/ui/network-error-screen';
import { discoverListings } from '@/dummy/listings-mock';

export default function PropertyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [retryCount, setRetryCount] = useState(0);

  const property = discoverListings.find((p) => p.id === id);

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  if (!property) {
    return (
      <NetworkErrorScreen
        key={retryCount}
        onRetry={handleRetry}
        subtitle="We couldn't load this property right now. It may have been removed or there's a network issue. Please try again."
      />
    );
  }

  return <PropertyDetailsScreen property={property} />;
}
