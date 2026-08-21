import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { useListing } from '@/hooks/use-listing';
import { useRespondToLodgeInvitation } from '@/hooks/use-lodge-invitations';
import { useAppToast } from '@/components/ui/toast-card';
import { useEscapeKey } from '@/components/claim/use-escape-key';
import type { PendingLodgeInvitation } from '@/types/liquidity';

type Props = {
  visible: boolean;
  invitation: PendingLodgeInvitation | null;
  onClose: () => void;
};

export function InviteResponseModal({ visible, invitation, onClose }: Props) {
  const { showToast } = useAppToast();
  const respond = useRespondToLodgeInvitation();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  useEscapeKey(onClose, visible);

  const listingId = invitation?.pod.listing_id ?? '';
  const { data: detail } = useListing(listingId);

  if (!invitation) return null;

  const lodgeTitle = detail?.listing.title ?? 'Gida Lodge';
  const cover = detail?.dbListing.primary_image ?? detail?.listing.image;
  const seatsLeft = Math.max(0, invitation.pod.target_occupancy - invitation.pod.current_total_intent);

  const handleRespond = async (action: 'accept' | 'decline') => {
    setBusy(action);
    try {
      const result = await respond.mutateAsync({ invitation, action, listing: detail?.dbListing });
      if (action === 'accept' && result) {
        showToast({ message: 'Invite accepted — complete your payment to lock the spot.', type: 'success' });
        onClose();
        router.push({ pathname: '/property/pay-slot', params: { id: result.credit.id } });
      } else {
        showToast({ message: 'Invite declined.', type: 'success' });
        onClose();
      }
    } catch (respondError) {
      console.error('[InviteResponseModal] Failed to respond to invite:', respondError);
      showToast({
        message: respondError instanceof Error ? respondError.message : 'Something went wrong. Try again.',
        type: 'error',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>You&rsquo;re invited</Text>
            <Text style={styles.subtitle}>Someone you know wants you in their lodge.</Text>

            <View style={styles.lodgeCard}>
              {cover ? <Image source={{ uri: cover }} style={styles.thumb} /> : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="home-outline" size={20} color={DesignColors.onSurfaceVariant} />
                </View>
              )}
              <View style={styles.copy}>
                <Text style={styles.lodgeTitle} numberOfLines={1}>{lodgeTitle}</Text>
                <Text style={styles.lodgeMeta}>
                  {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left · {invitation.pod.target_occupancy} total
                </Text>
              </View>
            </View>

            <View style={styles.noteRow}>
              <Ionicons name="information-circle-outline" size={16} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.noteText}>
                Accepting holds your seat with the same 3-day payment deadline as the rest of the group.
              </Text>
            </View>

            <Pressable
              style={[styles.button, styles.acceptButton, busy !== null && styles.buttonDisabled]}
              onPress={() => void handleRespond('accept')}
              disabled={busy !== null}
            >
              {busy === 'accept' ? (
                <ActivityIndicator color={DesignColors.onPrimary} />
              ) : (
                <>
                  <Text style={styles.acceptText}>Accept &amp; Pay</Text>
                  <Ionicons name="arrow-forward" size={15} color={DesignColors.onPrimary} />
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.button, styles.declineButton, busy !== null && styles.buttonDisabled]}
              onPress={() => void handleRespond('decline')}
              disabled={busy !== null}
            >
              {busy === 'decline' ? (
                <ActivityIndicator size="small" color={DesignColors.onSurfaceVariant} />
              ) : (
                <Text style={styles.declineText}>Decline invite</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: DesignColors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: DesignColors.borderMedium,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    gap: DesignSpacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainerHighest,
    marginBottom: 6,
  },
  title: { fontSize: 20, fontWeight: '600', letterSpacing: -0.2, color: DesignColors.onSurface, fontFamily },
  subtitle: { fontSize: 13, lineHeight: 18, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: -6 },
  lodgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  thumbPlaceholder: { backgroundColor: DesignColors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  lodgeTitle: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  lodgeMeta: { fontSize: 12, fontWeight: '600', color: DesignColors.primaryBright, fontFamily },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainer,
    borderRadius: DesignRadius.sm,
    padding: DesignSpacing.sm + 2,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17, color: DesignColors.onSurfaceVariant, fontFamily },
  button: {
    height: 52,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  acceptButton: { backgroundColor: DesignColors.primary },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignColors.inputBorder,
  },
  buttonDisabled: { opacity: 0.5 },
  acceptText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3, color: DesignColors.onPrimary, fontFamily },
  declineText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
});
