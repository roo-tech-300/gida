import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { PropertyDetailsScreen } from '@/components/property/property-details-screen';
import { NetworkErrorScreen } from '@/components/ui/network-error-screen';
import { useListing } from '@/hooks/use-listing';
import { DesignColors } from '@/constants/design';

export default function PropertyRoute() {
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
        subtitle="We couldn't load this property right now. It may have been removed or there's a network issue. Please try again."
      />
    );
  }

  return <PropertyDetailsScreen property={data.listing} photos={data.photos} dbListing={data.dbListing} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.surfaceContainerLowest },
});
