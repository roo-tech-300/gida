import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useSavedListings, useToggleSave } from '@/hooks/use-saved-listings';

import { SavedPropertyCard } from './saved-property-card';
import { SavedSpacesEmptyState } from './saved-spaces-empty-state';

export function SavedPropertiesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: listings = [], isLoading, isRefetching, refetch } = useSavedListings();
  const { mutate: toggleSave } = useToggleSave();
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
        <DiscoverBottomNav activeTab="saved" />
      </SafeAreaView>
    );
  }

  if (listings.length === 0) {
    return <SavedSpacesEmptyState />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.flex}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={DesignColors.primary} />
          }>
          <View style={styles.header}>
            <Text style={styles.title}>Saved Properties</Text>
            <Text style={styles.subtitle}>Your collection of residences</Text>
          </View>

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
        <DiscoverBottomNav activeTab="saved" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: DesignSpacing.xl + 40,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingBottom: DesignSpacing.xl * 5,
    gap: DesignSpacing.lg,
  },
  header: {
    gap: 4,
  },
  title: {
    ...DesignTypography.headlineLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
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