import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAppToast } from '@/components/ui/toast-card';
import { useListing } from '@/hooks/use-listing';
import { usePendingInvitationForListing, useRespondToLodgeInvitation } from '@/hooks/use-lodge-invitations';
import type { RoommateInviteAttachment } from '@/types/messages';

export function MessageRoommateInviteCard({
  attachment,
  isMe = false,
  participantName,
}: {
  attachment: RoommateInviteAttachment;
  isMe?: boolean;
  participantName?: string | null;
}) {
  const { showToast } = useAppToast();
  const respond = useRespondToLodgeInvitation();
  const { data: detail } = useListing(attachment.listingId);
  const { data: invitation } = usePendingInvitationForListing(attachment.listingId);
  const [busy, setBusy] = useState(false);

  const isInvitee = !isMe;
  const inviteStillPending = Boolean(invitation);

    const caption = isMe
      ? `You invited ${participantName ?? 'a friend'} to be your roommate.`
      : attachment.hasExistingSlot
        ? `${attachment.inviterName ?? 'Someone'} invited you to be their roommate — would you like to leave your current room and join them?`
        : `${attachment.inviterName ?? 'Someone'} invited you to be roommates.`;

  const handleViewLodge = () => router.push(`/property/${attachment.listingId}`);

  const handleAccept = async () => {
    if (!invitation) {
      handleViewLodge();
      return;
    }
    setBusy(true);
    try {
      const result = await respond.mutateAsync({
        invitation,
        action: 'accept',
        listing: detail?.dbListing,
      });
      if (result) {
        showToast({ message: 'Invite accepted — complete your payment to lock the spot.', type: 'success' });
        router.push({ pathname: '/property/pay-slot', params: { id: result.credit.id } });
      } else {
        showToast({ message: 'Invite accepted.', type: 'success' });
      }
    } catch (respondError) {
      console.error('[MessageRoommateInviteCard] Failed to accept invite:', respondError);
      showToast({
        message: respondError instanceof Error ? respondError.message : 'Something went wrong. Try again.',
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

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
          <View style={styles.badge}>
            <Ionicons name="people-outline" size={11} color={DesignColors.secondary} />
            <Text style={styles.badgeText}>Roommate invite</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{attachment.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.location} numberOfLines={1}>{attachment.location}</Text>
          </View>
          <Text style={styles.price}>{attachment.price}</Text>
        </View>
      </Pressable>

      <Text style={styles.caption}>{caption}</Text>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.viewButton]} onPress={handleViewLodge} accessibilityRole="button">
          <Ionicons name="eye-outline" size={15} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.viewText}>View lodge</Text>
        </Pressable>
        {isInvitee && inviteStillPending ? (
          <Pressable
            style={[styles.button, styles.acceptButton, busy && styles.buttonDisabled]}
            onPress={() => void handleAccept()}
            disabled={busy}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator size="small" color={DesignColors.onPrimary} />
            ) : (
              <>
                <Text style={styles.acceptText}>Accept</Text>
                <Ionicons name="arrow-forward" size={14} color={DesignColors.onPrimary} />
              </>
            )}
          </Pressable>
        ) : null}
      </View>
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
  price: {
    ...DesignTypography.labelLg,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '800',
  },
  caption: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    paddingHorizontal: DesignSpacing.sm,
    marginBottom: DesignSpacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.sm,
    paddingBottom: DesignSpacing.sm,
  },
  button: {
    flex: 1,
    height: 38,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  viewButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignColors.inputBorder,
  },
  acceptButton: {
    backgroundColor: DesignColors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  viewText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '600',
  },
  acceptText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
