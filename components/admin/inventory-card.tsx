import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import type { AdminListing } from '@/services/adminService';
import { ListingReadinessProgress } from '@/components/admin/listing-readiness-progress';
import { mediaCdnUrl } from '@/utils/media-url';

function formatCreatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  available: { bg: DesignColors.successContainer, color: DesignColors.success, label: 'Available' },
  booked: { bg: DesignColors.primaryTint, color: DesignColors.primaryBright, label: 'Booked' },
  maintenance: { bg: DesignColors.warningContainer, color: DesignColors.warning, label: 'Maintenance' },
};

export function InventoryCard({ listing, onPress }: { listing: AdminListing; onPress?: () => void }) {
  const s = STATUS_STYLE[listing.status.toLowerCase()] || STATUS_STYLE.available;
  const firstReadyVideo = [...(listing.listing_videos ?? [])]
    .filter((video) => video.status === 'ready' && video.poster_path)
    .sort((a, b) => a.display_order - b.display_order || a.created_at.localeCompare(b.created_at))[0];
  const videoCover = listing.video_cover_enabled ? firstReadyVideo : null;
  const coverImage = mediaCdnUrl(videoCover?.poster_path ?? null) ?? listing.primary_image ?? mediaCdnUrl(firstReadyVideo?.poster_path ?? null);
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.image} contentFit="cover" transition={180} />
        ) : (
          <View style={styles.emptyMedia}>
            <Ionicons name="images-outline" size={42} color={DesignColors.primaryFixed} />
            <Text style={styles.emptyMediaText}>Property media</Text>
          </View>
        )}
        <View style={styles.overlay} />
        {videoCover ? (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={13} color={DesignColors.onPrimary} />
            <Text style={styles.videoBadgeText}>VIDEO COVER</Text>
          </View>
        ) : null}
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
        </View>
        {listing.published === false ? (
          <View style={styles.draftBadge}>
            <Ionicons name="eye-off-outline" size={13} color={DesignColors.primaryFixed} />
            <Text style={styles.draftBadgeText}>NOT LIVE</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.location}>{listing.location_landmark}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <MetaPill icon="cash-outline" label={`₦${(listing.price_amount || 0).toLocaleString('en-US')}`} />
          {listing.featured ? <MetaPill icon="star-outline" label="Featured" /> : null}
          {listing.slashed_price && listing.slashed_price > listing.price_amount ? (
            <MetaPill
              icon="pricetag-outline"
              label={`Slash: ₦${listing.slashed_price.toLocaleString('en-US')}`}
            />
          ) : null}
        </View>

        {listing.published === false && (listing.video_expected_count ?? 0) > 0 ? (
          <ListingReadinessProgress
            listingId={listing.id}
            expected={listing.video_expected_count ?? 0}
            statuses={(listing.listing_videos ?? []).map((video) => video.status)}
          />
        ) : null}

        <View style={styles.bottomRow}>
          <View style={styles.managerInfo}>
            <Ionicons name="calendar-outline" size={13} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.managerText} numberOfLines={1}>{formatCreatedDate(listing.created_at)}</Text>
          </View>
          <Pressable style={styles.viewButton} onPress={onPress}>
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
    borderColor: DesignColors.cardBorder,
  },
  imageWrap: { height: 200, position: 'relative' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  emptyMedia: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DesignColors.surfaceContainerHighest,
  },
  emptyMediaText: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  videoBadge: {
    position: 'absolute', top: 16, left: 16, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
    backgroundColor: DesignColors.primaryFixed,
  },
  videoBadgeText: { ...DesignTypography.labelSm, color: DesignColors.onPrimary, fontFamily, fontWeight: '800', letterSpacing: 0.5 },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: DesignColors.scrimLight,
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
  draftBadge: {
    position: 'absolute', top: 16, right: 16, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
    backgroundColor: DesignColors.glassOpaque,
  },
  draftBadgeText: { fontSize: 10, color: DesignColors.onSurface, fontFamily, fontWeight: '800', letterSpacing: 0.7 },
  body: {
    gap: 14,
    padding: 16,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: DesignColors.borderSoft,
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
    backgroundColor: DesignColors.borderFaint,
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
