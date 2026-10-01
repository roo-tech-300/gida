import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import type { LodgeReservationAttachment } from '@/types/messages';

/**
 * Renders a lodge reservation (application) message. The same message lives in the
 * applicant <-> admin conversation, so the tap target is role-aware:
 *   - the admin is taken to the review screen to accept/reject the pod,
 *   - the applicant is taken to the "pending review" (not yet accepted) screen.
 */
export function MessageLodgeReservationCard({
  attachment,
  isMe = false,
}: {
  attachment: LodgeReservationAttachment;
  isMe?: boolean;
}) {
  const router = useRouter();
  const { profile } = useAuth();
  const isAdmin = Boolean(profile?.is_admin);

  const handlePress = () => {
    if (isAdmin) {
      router.push(`/admin/lodge-reservation/${attachment.podId}`);
      return;
    }
    // Legacy messages predating creditId cannot resolve a destination; no-op safely.
    if (!attachment.creditId) return;
    router.push({ pathname: '/property/pay-slot', params: { id: attachment.creditId } });
  };

  return (
    <Pressable
      testID="lodge-reservation-card"
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
          <Ionicons
            name={isAdmin ? 'clipboard-outline' : 'hourglass-outline'}
            size={11}
            color={DesignColors.secondary}
          />
          <Text style={styles.badgeText}>{isAdmin ? 'New application' : 'Awaiting review'}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{attachment.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.location} numberOfLines={1}>{attachment.location || 'Gida property'}</Text>
        </View>

        <Text style={styles.caption} numberOfLines={2}>
          {isAdmin
            ? `${attachment.userName || 'A resident'} applied for this lodge — tap to review.`
            : 'Your application is pending admin review — tap to view.'}
        </Text>
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
  caption: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
    marginTop: 2,
  },
});
