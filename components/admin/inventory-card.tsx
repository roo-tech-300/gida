import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import type { FeedListing } from '@/types/feed-listing';

const layoutLabels: Record<string, string> = {
  single_room: 'Single Room',
  self_contain: 'Self-Contain',
  flat: 'Flat',
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  available: { bg: 'rgba(74,225,115,0.12)', color: '#4ae176', label: 'Available' },
  booked: { bg: 'rgba(124,58,237,0.12)', color: '#7c3aed', label: 'Booked' },
  maintenance: { bg: 'rgba(255,182,149,0.12)', color: '#ffb695', label: 'Maintenance' },
};

export function InventoryCard({ listing }: { listing: FeedListing }) {
  const s = STATUS_STYLE[listing.status.toLowerCase()] || STATUS_STYLE.available;
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: listing.image || undefined }} style={styles.image} contentFit="cover" />
        <View style={styles.overlay} />
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.location}>{listing.location}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <MetaPill icon="bed-outline" label={listing.beds || layoutLabels[listing.layoutType] || listing.layoutType} />
          <MetaPill icon="water-outline" label={listing.baths || 'N/A'} />
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.managerInfo}>
            <Ionicons name="pricetag-outline" size={13} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.managerText} numberOfLines={1}>{listing.price}</Text>
          </View>
          <Pressable style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function MetaPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
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
  imageWrap: { height: 200, position: 'relative' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  badge: {
    position: 'absolute',
    left: 16, bottom: 16,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
    zIndex: 2,
  },
  badgeText: {
    ...DesignTypography.labelSm,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 1,
  },
  body: {
    gap: 14,
    padding: 16,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  titleBlock: { gap: 6 },
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
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  metaText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  managerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  managerText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  viewButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: DesignColors.primaryContainer,
  },
  viewButtonText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});