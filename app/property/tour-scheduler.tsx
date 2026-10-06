import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TourAdminBlockedScreen } from '@/components/property/tour-admin-blocked-screen';
import { TourSchedulerModal } from '@/components/property/tour-scheduler-modal';
import { useListing } from '@/hooks/use-listing';
import { useAdminProfile } from '@/hooks/use-admin-profile';
import { DesignColors } from '@/constants/design';

export default function TourSchedulerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useListing(String(id));
  const { data: admin, isLoading: adminLoading, isError: adminError, refetch: refetchAdmin } = useAdminProfile(data?.dbListing.admin_id);

  if (isLoading || adminLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DesignColors.primary} />
      </View>
    );
  }

  if (!data) {
    return <View style={styles.center} />;
  }

  if (data.dbListing.enable_guided_tour === false) {
    return (
      <TourAdminBlockedScreen
        onRetry={() => router.back()}
        showRetry={false}
        title="Tours are turned off"
        message="The host isn&apos;t offering guided tours for this listing right now. Check back later."
      />
    );
  }

  if (adminError || !admin) {
    return <TourAdminBlockedScreen onRetry={() => void refetchAdmin()} />;
  }

  return (
    <TourSchedulerModal
      propertyId={data.listing.id}
      propertyTitle={data.listing.title}
      propertyLocation={data.listing.location}
      admin={admin}
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
