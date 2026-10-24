import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiscoverTrendingCard } from '@/components/discover/discover-trending-card';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { Place } from '@/types/place';

type Props = {
  places: Place[];
  isSaved: (id: string) => boolean;
  onPressPlace: (place: Place) => void;
  onToggleSave: (place: Place) => void;
};

export function DiscoverTrendingRail({ places, isSaved, onPressPlace, onToggleSave }: Props) {
  if (places.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Hot this week</Text>
          <View style={styles.fireBadge}>
            <Text style={styles.fireBadgeText}>POPULAR</Text>
          </View>
        </View>
        <Text style={styles.sub}>Top picks around campus</Text>
      </View>
      <ScrollView
        horizontal
        contentContainerStyle={styles.row}
        showsHorizontalScrollIndicator={false}
      >
        {places.map((place) => (
          <DiscoverTrendingCard
            key={place.id}
            place={place}
            saved={isSaved(place.id)}
            onPress={() => onPressPlace(place)}
            onToggleSave={() => onToggleSave(place)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: DesignSpacing.md,
  },
  headerRow: {
    paddingHorizontal: DesignSpacing.marginMobile,
    marginBottom: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...DesignTypography.titleMd,
    fontSize: 20,
    fontWeight: '800',
    color: DesignColors.onSurface,
    fontFamily,
    letterSpacing: -0.3,
  },
  fireBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  fireBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: DesignColors.primaryFixed,
    letterSpacing: 0.8,
    fontFamily,
  },
  sub: {
    fontSize: 12,
    color: DesignColors.textSecondary,
    fontFamily,
    marginTop: 2,
  },
  row: {
    paddingHorizontal: DesignSpacing.marginMobile,
    gap: 12,
  },
});
