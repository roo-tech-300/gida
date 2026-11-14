import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import type { FeedListing } from '@/types/feed-listing';
import { layoutLabel } from '@/utils/layout-label';
import { spotsLeftLabel } from '@/utils/spots-left';

/** Scarcity and type chips, then the listing's name and where it is. */
export function PropertyTitleBlock({ property, spotsLeft }: { property: FeedListing; spotsLeft?: number }) {
  const scarcity = spotsLeftLabel(spotsLeft);
  const type = layoutLabel(property.layoutType);
  const isFull = spotsLeft !== undefined && spotsLeft <= 0;

  return (
    <View style={styles.block}>
      {scarcity || type ? (
        <View style={styles.chips}>
          {scarcity ? (
            <View style={[styles.chip, isFull ? styles.chipFull : styles.chipScarce]}>
              <Text style={[styles.chipText, { color: isFull ? DesignColors.danger : DesignColors.warning }]}>{scarcity}</Text>
            </View>
          ) : null}
          {type ? (
            <View style={[styles.chip, styles.chipType]}>
              <Text style={[styles.chipText, { color: DesignColors.onSurfaceVariant }]}>{type}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <Text style={styles.title} accessibilityRole="header">{property.title}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color={DesignColors.primaryBright} />
        <Text style={styles.location}>{property.location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: DesignSpacing.sm, marginBottom: DesignSpacing.lg },
  chips: { flexDirection: 'row', gap: DesignSpacing.sm },
  chip: { height: 26, paddingHorizontal: 12, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  chipScarce: { backgroundColor: DesignColors.warningContainer },
  chipFull: { backgroundColor: DesignColors.dangerContainer },
  chipType: { backgroundColor: DesignColors.borderSoft },
  chipText: { fontFamily, fontSize: 12, fontWeight: '700' },
  title: { fontFamily, fontSize: 26, lineHeight: 31, fontWeight: '800', color: DesignColors.onSurface, letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  location: { flex: 1, fontFamily, fontSize: 14, color: DesignColors.onSurfaceVariant },
});
