import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { formatTourDate } from '@/utils/tour-availability';
import type { TourAttachment } from '@/types/messages';

export function MessageTourCard({ attachment, isMe }: { attachment: TourAttachment; isMe?: boolean }) {
  const router = useRouter();
  const { profile } = useAuth();
  const isAdmin = Boolean(profile?.is_admin);

  const handlePress = () => {
    if (isAdmin) {
      router.push(`/admin/tour/${attachment.bookingId}`);
      return;
    }
    const passParams =
      `id=${attachment.listingId}&bookingId=${attachment.bookingId}` +
      `&date=${encodeURIComponent(formatTourDate(attachment.date))}` +
      `&time=${encodeURIComponent(attachment.time)}`;
    router.push(`/property/tour-pass?${passParams}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, isMe && styles.cardMe, pressed && styles.cardPressed]}
      onPress={handlePress}
    >
      {attachment.image ? (
        <Image source={{ uri: attachment.image }} style={styles.image} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Ionicons name="business-outline" size={24} color={DesignColors.onSurfaceVariant} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.badge}>
          <Ionicons name="calendar-outline" size={11} color={DesignColors.secondary} />
          <Text style={styles.badgeText}>{isAdmin ? 'Scheduled tour' : 'Meet your guide'}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{attachment.title}</Text>

        <View style={styles.scheduleRow}>
          <Ionicons name="calendar-outline" size={13} color={DesignColors.primaryBright} />
          <Text style={styles.scheduleText}>
            {formatTourDate(attachment.date)} · {attachment.time}
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.location} numberOfLines={1}>{attachment.location || 'Gida property'}</Text>
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {isAdmin
            ? 'A resident booked a guided tour with you.'
            : "You're all set for your guided tour — here's your pass."}
        </Text>

        <View style={styles.refRow}>
          <Ionicons name="ticket-outline" size={12} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.refText}>{attachment.reference}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: 240,
    maxWidth: 340,
    flexDirection: 'column',
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    borderRadius: DesignRadius.lg,
    overflow: 'hidden',
    marginBottom: DesignSpacing.xs,
  },
  cardMe: {
    backgroundColor: DesignColors.primaryTint,
    borderColor: DesignColors.primaryTint,
  },
  cardPressed: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
    height: 84,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 6,
    paddingHorizontal: DesignSpacing.sm,
    paddingVertical: DesignSpacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.secondary,
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
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  scheduleText: {
    ...DesignTypography.labelSm,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  message: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
    marginTop: 2,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  refText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    letterSpacing: 0.4,
  },
});
