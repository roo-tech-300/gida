import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { NetworkErrorScreen } from '@/components/ui/network-error-screen';
import { useListing } from '@/hooks/use-listing';
import { ListingDetailAdminScreen } from '@/components/admin/listing-detail-admin-screen';
import { DesignColors } from '@/constants/design';

export default function AdminListingRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useListing(id);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={DesignColors.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <NetworkErrorScreen
        onRetry={() => refetch()}
        subtitle="Unable to load this listing. It may have been removed or there's a network issue."
      />
    );
  }

  return <ListingDetailAdminScreen property={data.listing} photos={data.photos} dbListing={data.dbListing} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.surfaceContainerLowest },
});
