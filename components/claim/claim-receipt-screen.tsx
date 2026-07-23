import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '@/components/ui/back-button';
import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { useClaimByListingId, useMarkPaid, useCancelClaim } from '@/hooks/use-claim';
import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';
import { ClaimCountdown } from './claim-countdown';
import { ClaimPaymentSummary } from './claim-payment-summary';
import { ClaimRoommatesList } from './claim-roommates-list';

type Props = {
  listingId: string;
  onRefresh?: () => void;
};

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  locked_pending_roommate: { color: DesignColors.tertiary, bg: DesignColors.tertiary + '18', label: 'Holding' },
  locked_pending_payment: { color: DesignColors.tertiary, bg: DesignColors.tertiary + '18', label: 'Holding' },
  partially_paid: { color: DesignColors.primaryFixed, bg: DesignColors.primaryFixed + '18', label: 'Partially Paid' },
  completed: { color: DesignColors.secondary, bg: DesignColors.secondary + '18', label: 'Confirmed' },
  expired: { color: DesignColors.error, bg: DesignColors.error + '18', label: 'Expired' },
  active: { color: DesignColors.secondary, bg: DesignColors.secondary + '18', label: 'Active' },
};

export function ClaimReceiptScreen({ listingId, onRefresh }: Props) {
  const { profile } = useAuth();
  const currentUserId = profile?.id ?? '';
  const { data: claim, isLoading } = useClaimByListingId(listingId);
  const markPaid = useMarkPaid();
  const cancelClaimMutation = useCancelClaim();
  const { showToast } = useAppToast();

  const cancelConfirm = useCustomAlert();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Claim Details</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={28} color={DesignColors.outline} />
          <Text style={styles.loadingText}>Loading claim…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!claim) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Claim Details</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={28} color={DesignColors.error} />
          <Text style={styles.loadingText}>Claim not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { application_roommates: roommates } = claim;
  const allPaid = roommates.every((r) => r.has_paid);
  const status = STATUS_STYLE[claim.status] ?? STATUS_STYLE.expired;
  const isActive = claim.status !== 'completed' && claim.status !== 'expired';
  const showExpiry = isActive && claim.lock_expires_at && !allPaid;

  const handlePay = () => {
    showToast({ message: 'Payment integration coming soon.', type: 'info' });
    markPaid.mutate({ applicationId: claim.id }, { onSuccess: onRefresh });
  };

  const handleCancel = () => {
    cancelConfirm.showAlert({
      title: 'Cancel Claim',
      message: 'This action cannot be undone. You will lose this hold on the property.',
      buttons: [
        { label: 'Keep Claim', style: 'cancel' },
        {
          label: 'Cancel Claim',
          style: 'destructive',
          onPress: () =>
            cancelClaimMutation.mutate(
              { applicationId: claim.id },
              {
                onSuccess: () => {
                  showToast({ message: 'Your claim has been cancelled.', type: 'success' });
                  onRefresh?.();
                },
              },
            ),
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <BackButton hasBackground={false} />
        <Text style={styles.topBarTitle}>Claim Details</Text>
      </View>

      <ScrollView bounces={false} contentContainerStyle={styles.content}>
        {claim.status === 'completed' && (
          <View style={[styles.successBanner, { backgroundColor: status.bg }]}>
            <Ionicons name="checkmark-circle" size={22} color={status.color} />
            <Text style={[styles.successText, { color: status.color }]}>
              This claim is confirmed! You're all set.
            </Text>
          </View>
        )}

        <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        {showExpiry && (
          <View style={styles.countdownRow}>
            <Ionicons name="time-outline" size={16} color={DesignColors.tertiary} />
            <Text style={styles.countdownLabel}>Expires in</Text>
            <View style={styles.countdownDigits}>
              <ClaimCountdown expiresAt={claim.lock_expires_at!} variant="inline" />
            </View>
          </View>
        )}

        <ClaimPaymentSummary claim={claim} currentUserId={currentUserId} />

        <ClaimRoommatesList
          roommates={roommates}
          allPaid={allPaid}
          onRemind={() =>
            showToast({ message: 'Your roommate will be notified to accept the invite.', type: 'success' })
          }
        />

        {isActive && (
          <>
            {!allPaid && (
              <TouchableOpacity
                style={[styles.payButton, markPaid.isPending && { opacity: 0.6 }]}
                onPress={handlePay}
                disabled={markPaid.isPending}
                activeOpacity={0.8}
              >
                {markPaid.isPending ? (
                  <Ionicons name="hourglass-outline" size={20} color={DesignColors.onSurface} />
                ) : (
                  <Ionicons name="card-outline" size={20} color={DesignColors.onSurface} />
                )}
                <Text style={styles.payButtonText}>Pay Your Share</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={handleCancel}
              hitSlop={{ top: 12, bottom: 12 }}
              disabled={cancelClaimMutation.isPending}
            >
              <Text style={styles.cancelText}>
                {cancelClaimMutation.isPending ? 'Cancelling…' : 'Cancel Claim'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <CustomAlert
        visible={cancelConfirm.visible}
        title={cancelConfirm.title}
        message={cancelConfirm.message}
        buttons={cancelConfirm.buttons}
        onDismiss={cancelConfirm.hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.sm + 4,
  },
  topBarTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingBottom: DesignSpacing.xl,
    gap: DesignSpacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
  },
  loadingText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.md,
  },
  successText: { ...DesignTypography.bodyMd, fontFamily, fontWeight: '600', flex: 1 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...DesignTypography.labelLg, fontFamily, fontWeight: '700' },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: DesignSpacing.sm,
  },
  countdownLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  countdownDigits: { marginLeft: 'auto' },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.md,
    paddingVertical: 16,
  },
  payButtonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.textPrimary,
    fontFamily,
    fontWeight: '700',
  },
  cancelLink: { alignItems: 'center', paddingVertical: DesignSpacing.sm },
  cancelText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textDecorationLine: 'underline',
  },
});
