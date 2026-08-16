import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { TourSchedulerModal } from '@/components/property/tour-scheduler-modal';
import { useListing } from '@/hooks/use-listing';
import { useAdminProfile } from '@/hooks/use-admin-profile';
import { DesignColors } from '@/constants/design';

export default function TourSchedulerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useListing(String(id));
  const { data: admin } = useAdminProfile(data?.dbListing.admin_id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DesignColors.primary} />
      </View>
    );
  }

  if (!data) {
    return <View style={styles.center} />;
  }

  return (
    <TourSchedulerModal
      propertyId={data.listing.id}
      propertyTitle={data.listing.title}
      propertyLocation={data.listing.location}
      admin={admin ?? null}
    />
  );
}

const styles = {
  center: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
};
