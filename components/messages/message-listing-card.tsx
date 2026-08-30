import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type ListingAttachment } from '@/types/messages';

export function MessageListingCard({
  attachment,
  isMe,
}: {
  attachment: ListingAttachment;
  isMe?: boolean;
}) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, isMe && styles.cardMe, pressed && styles.cardPressed]}
      onPress={() => router.push(`/property/${attachment.listingId}`)}
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
          <Ionicons name="business-outline" size={11} color={DesignColors.secondary} />
          <Text style={styles.badgeText}>Shared listing</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{attachment.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.location} numberOfLines={1}>{attachment.location}</Text>
          </View>
          <Text style={styles.price}>{attachment.price}</Text>
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  location: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  price: {
    ...DesignTypography.labelLg,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '800',
  },
});