import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { TourSchedulerModal } from '@/components/property/tour-scheduler-modal';
import { discoverListings } from '@/dummy/listings-mock';
import { DesignColors } from '@/constants/design';

export default function TourSchedulerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const property = discoverListings.find((p) => p.id === id);

  if (!property) {
    return <View style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }} />;
  }

  return <TourSchedulerModal propertyId={property.id} propertyTitle={property.title} propertyLocation={property.location} />;
}
