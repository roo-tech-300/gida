import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { PodJoinAttachment } from '@/types/messages';

export function MessagePodJoinCard({
  attachment,
  isMe = false,
}: {
  attachment: PodJoinAttachment;
  isMe?: boolean;
}) {
  const router = useRouter();
  const joinedViaInvite = attachment.source === 'code';

  const handleViewLodge = () => router.push(`/property/${attachment.listingId}`);

  return (
    <View style={styles.card}>
      <Pressable style={styles.previewRow} onPress={handleViewLodge}>
        {attachment.image ? (
          <Image source={{ uri: attachment.image }} style={styles.thumb} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Ionicons name="business-outline" size={22} color={DesignColors.onSurfaceVariant} />
          </View>
        )}
        <View style={styles.copy}>
          <View style={[styles.badge, isMe && styles.badgeMe]}>
            <Ionicons name="people-outline" size={11} color={DesignColors.secondary} />
            <Text style={styles.badgeText}>{joinedViaInvite ? 'Joined via invite' : 'Joined your group'}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{attachment.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.location} numberOfLines={1}>{attachment.location}</Text>
          </View>
          <View style={styles.seatRow}>
            <Ionicons name="people-outline" size={11} color={DesignColors.primaryBright} />
            <Text style={styles.seatText}>Seat {attachment.seatNumber} of {attachment.totalSeats}</Text>
          </View>
        </View>
      </Pressable>

      <Text style={styles.caption}>
        {attachment.joinerName} {joinedViaInvite ? 'just joined via your invite code' : 'just joined your group'}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: 280,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    borderRadius: DesignRadius.lg,
    overflow: 'hidden',
    marginBottom: DesignSpacing.xs,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    padding: DesignSpacing.sm,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.secondary,
    marginBottom: 1,
  },
  badgeMe: {
    borderColor: DesignColors.primaryBright,
  },
  badgeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.secondary,
    fontFamily,
    fontWeight: '700',
  },
  title: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    ...DesignTypography.bodyMd,
    fontSize: 12,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flexShrink: 1,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seatText: {
    ...DesignTypography.labelSm,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '600',
  },
  caption: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    paddingHorizontal: DesignSpacing.sm,
    marginBottom: DesignSpacing.sm,
  },
});
