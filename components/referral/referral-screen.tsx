import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '@/components/ui/back-button';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { copyTextToClipboard } from '@/utils/clipboard';
import { useAuth } from '@/context/auth-context';
import {
  useReferral,
  useMyReferrals,
  useMyWithdrawalRequests,
  useSubmitWithdrawal,
  useSaveBankDetails,
} from '@/hooks/use-referral';
import type { ReferralWithProfile } from '@/types/referral';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EarningsCard({ label, amount, accent }: { label: string; amount: number; accent?: boolean }) {
  return (
    <View style={[styles.earningsCard, accent && styles.earningsCardAccent]}>
      <Text style={[styles.earningsAmount, accent && styles.earningsAmountAccent]}>
        {formatNaira(amount)}
      </Text>
      <Text style={styles.earningsLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ReferralRow({ item }: { item: ReferralWithProfile }) {
  const name = item.referred_profile?.full_name ?? 'Gida User';
  return (
    <View style={styles.referralRow}>
      <View style={styles.referralAvatar}>
        <Text style={styles.referralAvatarText}>{getInitials(name)}</Text>
      </View>
      <View style={styles.referralInfo}>
        <Text style={styles.referralName} numberOfLines={1}>{name}</Text>
        <Text style={styles.referralDate}>{formatDate(item.created_at)}</Text>
      </View>
      {item.payment_status === 'paid' ? (
        <View style={styles.paidBadge}>
          <Ionicons name="checkmark-circle" size={14} color={DesignColors.success} />
          <Text style={styles.paidBadgeText}>Paid</Text>
        </View>
      ) : item.payment_status === 'pending' ? (
        <View style={styles.awaitingBadge}>
          <Ionicons name="time-outline" size={14} color={DesignColors.warning} />
          <Text style={styles.awaitingBadgeText}>Awaiting payout</Text>
        </View>
      ) : (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Joined</Text>
        </View>
      )}
    </View>
  );
}

// ─── Withdrawal sheet ─────────────────────────────────────────────────────────

type WithdrawSheetProps = {
  pendingAmount: number;
  initialBankName: string;
  initialAccountNumber: string;
  initialAccountName: string;
  onClose: () => void;
};

function WithdrawSheet({
  pendingAmount,
  initialBankName,
  initialAccountNumber,
  initialAccountName,
  onClose,
}: WithdrawSheetProps) {
  const { showToast } = useAppToast();
  const { mutateAsync: submit, isPending } = useSubmitWithdrawal();
  const { mutateAsync: saveBankDetails } = useSaveBankDetails();

  const [bankName, setBankName] = useState(initialBankName);
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
  const [accountName, setAccountName] = useState(initialAccountName);

  const handleSubmit = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      showToast({ message: 'Please fill in all bank details.', type: 'error' });
      return;
    }
    if (pendingAmount <= 0) {
      showToast({ message: 'You have no pending earnings to withdraw.', type: 'error' });
      return;
    }
    try {
      const details = {
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      };
      // Save bank details to profile for future use
      await saveBankDetails(details);
      await submit({ amount: pendingAmount, bankDetails: details });
      showToast({ message: 'Withdrawal request submitted. We will process it shortly.', type: 'success' });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit request.';
      showToast({ message: msg, type: 'error' });
    }
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <Text style={styles.sheetTitle}>Withdraw Earnings</Text>
      <Text style={styles.sheetSubtitle}>
        You are requesting {formatNaira(pendingAmount)}. We will process your transfer within 2 business days.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Bank Name</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="e.g. GTBank"
          placeholderTextColor={DesignColors.onSurfaceVariant}
          value={bankName}
          onChangeText={setBankName}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Account Number</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="10-digit account number"
          placeholderTextColor={DesignColors.onSurfaceVariant}
          keyboardType="numeric"
          maxLength={10}
          value={accountNumber}
          onChangeText={(t) => setAccountNumber(t.replace(/\D/g, ''))}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Account Name</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="Name on account"
          placeholderTextColor={DesignColors.onSurfaceVariant}
          autoCapitalize="words"
          value={accountName}
          onChangeText={setAccountName}
        />
      </View>

      <Pressable
        style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Request</Text>
        )}
      </Pressable>
      <Pressable style={styles.cancelBtn} onPress={onClose}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ReferralScreen() {
  const { profile } = useAuth();
  const { showToast } = useAppToast();
  const referral = useReferral();
  const [filter, setFilter] = useState<'all' | 'paid'>('all');
  const [showWithdraw, setShowWithdraw] = useState(false);

  const {
    data: referralPages,
    isLoading: referralsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchReferrals,
  } = useMyReferrals(filter);

  const { data: withdrawalRequests } = useMyWithdrawalRequests();

  const allReferrals = referralPages?.pages.flat() ?? [];

  const pendingAmount = referral.earnings?.total_pending ?? 0;
  const totalEarned = (referral.earnings?.total_pending ?? 0) + (referral.earnings?.total_paid ?? 0);
  const hasPendingRequest = withdrawalRequests?.some((r) => r.status === 'pending') ?? false;

  const handleCopy = async () => {
    if (!referral.link) return;
    const copied = await copyTextToClipboard(referral.link);
    showToast({ message: copied ? 'Link copied!' : 'Failed to copy', type: copied ? 'success' : 'error' });
  };

  const handleShare = async () => {
    if (!referral.link) return;
    try {
      await Share.share({ message: `Join me on Gida! ${referral.link}` });
    } catch {
      showToast({ message: 'Failed to share link', type: 'error' });
    }
  };

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onRefresh = useCallback(() => {
    void referral.refetchEarnings();
    void refetchReferrals();
  }, [referral, refetchReferrals]);

  const ListHeader = (
    <View style={styles.listHeader}>
      {/* ── Hero earnings ── */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>AVAILABLE BALANCE</Text>
        <Text style={styles.heroAmount}>
          {referral.isLoading ? '—' : formatNaira(pendingAmount)}
        </Text>
        <Text style={styles.heroSub}>
          {formatNaira(totalEarned)} earned in total · ₦2,000 per referral who buys a lodge
        </Text>
      </View>

      {/* ── Earnings breakdown ── */}
      {(pendingAmount > 0 || (referral.earnings?.total_paid ?? 0) > 0) && (
        <View style={styles.earningsRow}>
          {pendingAmount > 0 && (
            <EarningsCard label="Awaiting payout" amount={pendingAmount} accent />
          )}
          {(referral.earnings?.total_paid ?? 0) > 0 && (
            <EarningsCard label="Paid out" amount={referral.earnings!.total_paid} />
          )}
        </View>
      )}

      {/* ── Withdraw button ── */}
      {pendingAmount > 0 && (
        <Pressable
          style={[styles.withdrawBtn, hasPendingRequest && styles.withdrawBtnDisabled]}
          onPress={() => {
            if (hasPendingRequest) {
              showToast({ message: 'You already have a pending withdrawal request.', type: 'info' });
              return;
            }
            setShowWithdraw(true);
          }}
        >
          <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
          <Text style={styles.withdrawBtnText}>
            {hasPendingRequest ? 'Withdrawal Pending…' : 'Withdraw Earnings'}
          </Text>
        </Pressable>
      )}

      {/* ── Referral link ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Referral Link</Text>
        {referral.link ? (
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
              {referral.link}
            </Text>
            <Pressable style={styles.iconBtn} onPress={handleCopy} accessibilityLabel="Copy link">
              <Ionicons name="copy-outline" size={18} color={DesignColors.primaryBright} />
            </Pressable>
          </View>
        ) : referral.isLoading ? (
          <ActivityIndicator color={DesignColors.primaryBright} style={{ marginTop: 8 }} />
        ) : null}

        <Pressable style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
          <Text style={styles.shareBtnText}>Share Link</Text>
        </Pressable>
      </View>

      {/* ── Referrals list header ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>People You Referred</Text>
        <View style={styles.chipRow}>
          <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label="Bought a Lodge" active={filter === 'paid'} onPress={() => setFilter('paid')} />
        </View>
      </View>
    </View>
  );

  const ListEmpty = referralsLoading ? (
    <ActivityIndicator color={DesignColors.primaryBright} style={{ marginTop: 32 }} />
  ) : (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={36} color={DesignColors.onSurfaceVariant} />
      <Text style={styles.emptyTitle}>
        {filter === 'paid' ? 'No lodge purchases yet' : 'No referrals yet'}
      </Text>
      <Text style={styles.emptyText}>
        {filter === 'paid'
          ? 'When someone you referred buys a lodge, they will show up here.'
          : 'Share your link and your referrals will appear here.'}
      </Text>
    </View>
  );

  const ListFooter = isFetchingNextPage ? (
    <ActivityIndicator color={DesignColors.primaryBright} style={{ marginVertical: 16 }} />
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <BackButton hasBackground={false} />
        <Text style={styles.topBarTitle}>Refer & Earn</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <FlatList
        data={allReferrals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReferralRow item={item} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={referral.isLoading}
            onRefresh={onRefresh}
            tintColor={DesignColors.primaryBright}
          />
        }
      />

      {/* Withdrawal sheet overlay */}
      {showWithdraw && (
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowWithdraw(false)} />
          <WithdrawSheet
            pendingAmount={pendingAmount}
            initialBankName={profile?.payout_bank_name ?? ''}
            initialAccountNumber={profile?.payout_account_number ?? ''}
            initialAccountName={profile?.payout_account_name ?? ''}
            onClose={() => setShowWithdraw(false)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.sm,
    gap: DesignSpacing.md,
  },
  topBarTitle: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily, flex: 1 },
  topBarSpacer: { width: 40 },

  listContent: { paddingBottom: DesignSpacing.xl * 2 },
  listHeader: { gap: DesignSpacing.lg, paddingHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.sm },

  // Hero card
  heroCard: {
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.xl,
    padding: DesignSpacing.lg,
    gap: DesignSpacing.xs,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  heroLabel: { ...DesignTypography.labelCaps, color: DesignColors.onPrimaryContainer, fontFamily, opacity: 0.8 },
  heroAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    letterSpacing: -1,
  },
  heroSub: { ...DesignTypography.labelSm, color: DesignColors.onPrimaryContainer, fontFamily, opacity: 0.75 },

  // Earnings
  earningsRow: { flexDirection: 'row', gap: DesignSpacing.sm },
  earningsCard: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: DesignRadius.lg,
    padding: DesignSpacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  earningsCardAccent: { borderColor: DesignColors.primaryTintBorder },
  earningsAmount: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  earningsAmountAccent: { color: DesignColors.primaryBright },
  earningsLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },

  // Withdraw button
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primary,
    borderRadius: DesignRadius.full,
    paddingVertical: 14,
  },
  withdrawBtnDisabled: { opacity: 0.5 },
  withdrawBtnText: { ...DesignTypography.labelLg, color: '#FFFFFF', fontFamily, fontWeight: '700' },

  // Link
  section: { gap: DesignSpacing.sm },
  sectionTitle: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: DesignRadius.md,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  linkText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, flex: 1 },
  iconBtn: { padding: 4 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.full,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  shareBtnText: { ...DesignTypography.labelLg, color: '#FFFFFF', fontFamily, fontWeight: '700' },

  // Filter chips
  chipRow: { flexDirection: 'row', gap: DesignSpacing.sm },
  chip: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 8,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  chipActive: { backgroundColor: DesignColors.primaryTint, borderColor: DesignColors.primaryTintBorder },
  chipText: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, fontWeight: '600' },
  chipTextActive: { color: DesignColors.primaryBright },

  // Referral rows
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.borderFaint,
  },
  referralAvatar: {
    width: 42,
    height: 42,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralAvatarText: { ...DesignTypography.labelLg, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  referralInfo: { flex: 1, gap: 2 },
  referralName: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  referralDate: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.successContainer,
  },
  paidBadgeText: { ...DesignTypography.labelSm, color: DesignColors.success, fontFamily, fontWeight: '700' },
  awaitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.warningContainer,
  },
  awaitingBadgeText: { ...DesignTypography.labelSm, color: DesignColors.warning, fontFamily, fontWeight: '700' },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  pendingBadgeText: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: DesignSpacing.xl * 2,
    paddingHorizontal: DesignSpacing.xl,
    gap: DesignSpacing.sm,
  },
  emptyTitle: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily, textAlign: 'center' },
  emptyText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },

  // Withdraw sheet
  sheetOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderTopLeftRadius: DesignRadius.xl,
    borderTopRightRadius: DesignRadius.xl,
    padding: DesignSpacing.lg,
    paddingBottom: 40,
    gap: DesignSpacing.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: DesignColors.borderSoft,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: DesignColors.borderMedium,
    alignSelf: 'center',
    marginBottom: DesignSpacing.xs,
  },
  sheetTitle: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  sheetSubtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  fieldGroup: { gap: 6 },
  fieldLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, fontWeight: '600' },
  fieldInput: {
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 12,
    color: DesignColors.onSurface,
    fontFamily,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: DesignColors.primary,
    borderRadius: DesignRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DesignSpacing.xs,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { ...DesignTypography.labelLg, color: '#FFFFFF', fontFamily, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelBtnText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
});
