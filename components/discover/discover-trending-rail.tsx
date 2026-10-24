import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      <Text style={styles.title}>Hot this week</Text>
      <ScrollView horizontal contentContainerStyle={styles.row} showsHorizontalScrollIndicator={false}>
        {places.map((place) => {
          const saved = isSaved(place.id);
          return (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              onPress={() => onPressPlace(place)}
              style={styles.chip}
            >
              <Text numberOfLines={1} style={styles.name}>
                {place.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onToggleSave(place)}
              >
                <Ionicons
                  color={saved ? DesignColors.primary : DesignColors.onSurfaceVariant}
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                />
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: DesignSpacing.sm,
  },
  title: {
    ...DesignTypography.titleMd,
    paddingHorizontal: DesignSpacing.marginMobile,
    marginBottom: 10,
    color: DesignColors.onSurface,
    fontFamily,
  },
  row: {
    paddingHorizontal: DesignSpacing.marginMobile,
    gap: 8,
  },
  chip: {
    maxWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  name: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.textPrimary,
    fontFamily,
  },
});
