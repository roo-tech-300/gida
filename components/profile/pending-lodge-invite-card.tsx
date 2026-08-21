import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { useListing } from '@/hooks/use-listing';
import { useMyPendingInvitations, useRespondToLodgeInvitation } from '@/hooks/use-lodge-invitations';
import { useAppToast } from '@/components/ui/toast-card';
import type { PendingLodgeInvitation } from '@/types/liquidity';

export function PendingLodgeInvites() {
  const { data: invitations = [], isError, error } = useMyPendingInvitations();

  if (isError) {
    console.error('[PendingLodgeInvites] Failed to load invitations:', error);
    return null;
  }
  if (invitations.length === 0) return null;

  return (
    <View style={styles.stack}>
      {invitations.map((invitation) => (
        <LodgeInviteCard key={invitation.id} invitation={invitation} />
      ))}
    </View>
  );
}

function LodgeInviteCard({ invitation }: { invitation: PendingLodgeInvitation }) {
  const { showToast } = useAppToast();
  const respond = useRespondToLodgeInvitation();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const listingId = invitation.pod.listing_id ?? '';
  const { data: detail } = useListing(listingId);

  const lodgeTitle = detail?.listing.title ?? 'Gida Lodge';
  const cover = detail?.dbListing.primary_image ?? detail?.listing.image;
  const seatsLeft = Math.max(0, invitation.pod.target_occupancy - invitation.pod.current_total_intent);

  const handleRespond = async (action: 'accept' | 'decline') => {
    setBusy(action);
    try {
      const result = await respond.mutateAsync({ invitation, action, listing: detail?.dbListing });
      if (action === 'accept' && result) {
        showToast({ message: 'Invite accepted — complete your payment to lock the spot.', type: 'success' });
        router.push({ pathname: '/property/pay-slot', params: { id: result.credit.id } });
      } else {
        showToast({ message: 'Invite declined.', type: 'success' });
      }
    } catch (respondError) {
      console.error('[PendingLodgeInvites] Failed to respond to invite:', respondError);
      showToast({
        message: respondError instanceof Error ? respondError.message : 'Something went wrong. Try again.',
        type: 'error',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="home-outline" size={20} color={DesignColors.primaryBright} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{invitation.invitee_name ? `${invitation.invitee_name}, you're invited` : "You're invited"}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {lodgeTitle} · {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left
          </Text>
        </View>
        {cover ? <Image source={{ uri: cover }} style={styles.thumb} /> : null}
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.declineButton]}
          onPress={() => void handleRespond('decline')}
          disabled={busy !== null}
          accessibilityRole="button"
        >
          {busy === 'decline' ? (
            <ActivityIndicator size="small" color={DesignColors.onSurfaceVariant} />
          ) : (
            <Text style={styles.declineText}>Decline</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.button, styles.acceptButton]}
          onPress={() => void handleRespond('accept')}
          disabled={busy !== null}
          accessibilityRole="button"
        >
          {busy === 'accept' ? (
            <ActivityIndicator size="small" color={DesignColors.onPrimary} />
          ) : (
            <>
              <Text style={styles.acceptText}>Accept</Text>
              <Ionicons name="arrow-forward" size={14} color={DesignColors.onPrimary} />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: DesignSpacing.sm, marginHorizontal: DesignSpacing.marginMobile },
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  subtitle: { fontSize: 12, lineHeight: 16, color: DesignColors.onSurfaceVariant, fontFamily },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  actions: { flexDirection: 'row', gap: DesignSpacing.sm },
  button: {
    flex: 1,
    height: 42,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignColors.inputBorder,
  },
  acceptButton: { backgroundColor: DesignColors.primary },
  declineText: { fontSize: 13, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
  acceptText: { fontSize: 13, fontWeight: '700', color: DesignColors.onPrimary, fontFamily },
});
