import { useLocalSearchParams } from 'expo-router';

import { TourSchedulerModal } from '@/components/property/tour-scheduler-modal';
import { discoverListings } from '@/dummy/listings-mock';

export default function TourSchedulerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const property = discoverListings.find((p) => p.id === id);

  if (!property) return null;

  return <TourSchedulerModal propertyId={property.id} propertyTitle={property.title} propertyLocation={property.location} />;
}
