import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TourPassScreen } from '@/components/property/tour-pass-screen';
import { useListing } from '@/hooks/use-listing';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export default function TourPassRoute() {
  const { id, date, time, bookingId } = useLocalSearchParams<{
    id: string;
    date: string;
    time: string;
    bookingId?: string;
  }>();
  const { data, isLoading, isError } = useListing(id ?? '');

  if (isLoading || (!isError && !data)) {
    return <View style={styles.fallback} />;
  }

  if (isError || !data) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.errorText}>We could not load this tour.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <TourPassScreen
      propertyTitle={data.listing.title}
      propertyLocation={data.listing.location}
      date={date ?? ''}
      time={time ?? ''}
      bookingId={bookingId}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.md,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  errorText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  backButton: {
    paddingHorizontal: DesignSpacing.lg,
    paddingVertical: 12,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
  },
  backText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimary, fontFamily, fontWeight: '600' },
});
