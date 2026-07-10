import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { savedProperties } from '@/dummy/saved-properties-mock';

import { SavedPropertyCard } from './saved-property-card';
import { SavedSpacesEmptyState } from './saved-spaces-empty-state';

export function SavedPropertiesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visibleProperties = useMemo(
    () => savedProperties.filter((property) => !removedIds.has(property.id)),
    [removedIds],
  );

  if (visibleProperties.length === 0) {
    return <SavedSpacesEmptyState />;
  }

  const isWide = width >= 960;

  const removeProperty = (id: string) => {
    setRemovedIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  const onViewProperty = useCallback(
    (id: string) => router.push(`/property/${id}`),
    [router],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.flex}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Saved Properties</Text>
            <Text style={styles.subtitle}>Your collection of residences</Text>
          </View>

          <View style={[styles.list, isWide && styles.listWide]}>
            {visibleProperties.map((property) => (
              <View key={property.id} style={[styles.cardWrap, isWide && styles.cardWrapWide]}>
                <SavedPropertyCard property={property} onRemove={removeProperty} onView={onViewProperty} />
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
