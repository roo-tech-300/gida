import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { TourPassScreen } from '@/components/property/tour-pass-screen';
import { discoverListings } from '@/dummy/listings-mock';
import { DesignColors } from '@/constants/design';

export default function TourPassRoute() {
  const { id, date, time } = useLocalSearchParams<{ id: string; date: string; time: string }>();
  const property = discoverListings.find((p) => p.id === id);

  if (!property || !date || !time) {
    return <View style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }} />;
  }

  return (
    <TourPassScreen
      propertyTitle={property.title}
      propertyLocation={property.location}
      date={date}
      time={time}
    />
  );
}
