import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useSavedListings, useToggleSave } from '@/hooks/use-saved-listings';

import { SavedPropertyCard } from './saved-property-card';
import { SavedSpacesEmptyState } from './saved-spaces-empty-state';

export function SavedPropertiesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: listings = [], isLoading, isRefetching, refetch } = useSavedListings();
  const { mutate: toggleSave } = useToggleSave();
  const [, setRemovingId] = useState<string | null>(null);

  const isWide = width >= 960;

  const onRemove = useCallback(
    (id: string) => {
      setRemovingId(id);
      toggleSave(id, {
        onSettled: () => setRemovingId(null),
      });
    },
    [toggleSave],
  );

  const onViewProperty = useCallback(
    (id: string) => router.push(`/property/${id}`),
    [router],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <BackButton />
        <Text style={styles.title}>Saved Properties</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      ) : listings.length === 0 ? (
        <SavedSpacesEmptyState />
      ) : (
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={DesignColors.primary} />
          }>
          <View style={[styles.list, isWide && styles.listWide]}>
            {listings.map((listing) => (
              <View key={listing.id} style={[styles.cardWrap, isWide && styles.cardWrapWide]}>
                <SavedPropertyCard
                  listing={listing}
                  onRemove={onRemove}
                  onView={onViewProperty}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.cardBorder,
  },
  title: {
    flex: 1,
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: DesignSpacing.lg,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingBottom: DesignSpacing.xl,
  },
  list: {
    gap: DesignSpacing.lg,
  },
  listWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardWrap: {
    width: '100%',
  },
  cardWrapWide: {
    width: '48%',
  },
});
