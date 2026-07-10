import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type SavedProperty } from '@/dummy/saved-properties-mock';

export function SavedPropertyCard({
  property,
  onRemove,
  onView,
}: {
  property: SavedProperty;
  onRemove: (id: string) => void;
  onView: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={property.image} style={styles.image} contentFit="cover" />
        <View style={styles.overlay} />

        <Pressable accessibilityRole="button" onPress={() => onRemove(property.id)} style={styles.saveButton}>
          <Ionicons name="heart" size={18} color={DesignColors.primaryContainer} />
        </Pressable>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{property.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{property.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.location}>{property.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <MetaPill icon="bed-outline" label={property.beds} />
          <MetaPill icon="water-outline" label={property.baths} />
          <MetaPill icon="square-outline" label={property.size} />
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Per Academic Year</Text>
            <Text style={styles.price}>{property.price}</Text>
          </View>
          <Pressable onPress={() => onView(property.id)} style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MetaPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={14} color={DesignColors.primaryBright} />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  imageWrap: {
    height: 256,
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  saveButton: {
    position: 'absolute',
    top: DesignSpacing.md,
    right: DesignSpacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 30, 0.72)',
    zIndex: 2,
  },
  badge: {
    position: 'absolute',
    left: DesignSpacing.md,
    bottom: DesignSpacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.92)',
    zIndex: 2,
  },
  badgeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 1,
  },
  body: {
    gap: DesignSpacing.md,
    padding: DesignSpacing.lg,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DesignSpacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 6,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
    paddingVertical: DesignSpacing.xs,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  metaText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignSpacing.md,
  },
  priceLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  price: {
    ...DesignTypography.headlineMd,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '800',
  },
  viewButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: DesignRadius.xl,
    backgroundColor: DesignColors.primaryContainer,
  },
  viewButtonText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
