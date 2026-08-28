import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { DbListing } from '@/types/feed-listing';

export type ToggleAmenity = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const AMENITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  has_borehole: 'water-outline',
  has_generator: 'flash-outline',
  has_internet: 'wifi-outline',
  has_fenced_gate: 'shield-outline',
  has_burglary: 'lock-closed-outline',
  has_cabinet: 'layers-outline',
  has_wardrobe: 'shirt-outline',
  is_shared_bathroom: 'people-outline',
  is_shared_kitchen: 'restaurant-outline',
};

const AMENITY_LABELS: Record<string, string> = {
  has_borehole: 'Borehole',
  has_generator: 'Generator',
  has_internet: 'Internet',
  has_fenced_gate: 'Fenced Gate',
  has_burglary: 'Burglary Proof',
  has_cabinet: 'Cabinet',
  has_wardrobe: 'Wardrobe',
  is_shared_bathroom: 'Shared Bath',
  is_shared_kitchen: 'Shared Kitchen',
};

export function getToggleAmenities(listing: DbListing): ToggleAmenity[] {
  return Object.keys(AMENITY_ICONS)
    .filter((key) => Boolean(listing[key as keyof DbListing]))
    .map((key) => ({ key, label: AMENITY_LABELS[key], icon: AMENITY_ICONS[key] }));
}

export function PropertyKeyAmenities({ amenities }: { amenities: ToggleAmenity[] }) {
  if (amenities.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerBar} />
        <Text style={styles.header}>KEY AMENITIES</Text>
      </View>
      <View style={styles.grid}>
        {amenities.map((item) => (
          <View key={item.key} style={styles.tile}>
            <View style={styles.iconBg}>
              <Ionicons name={item.icon} size={26} color={DesignColors.primaryBright} />
            </View>
            <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: DesignSpacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, marginBottom: DesignSpacing.md },
  headerBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: DesignColors.primaryBright },
  header: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, rowGap: 16 },
  tile: { width: '31.5%', alignItems: 'center', gap: 8 },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: DesignRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  label: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600', textAlign: 'center' },
});
