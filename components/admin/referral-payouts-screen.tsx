import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '@/components/ui/back-button';
import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { fetchPendingWithdrawalRequests, disburseWithdrawal } from '@/services/referral-service';
import { copyTextToClipboard } from '@/utils/clipboard';
import type { WithdrawalRequestWithProfile } from '@/types/referral';

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

// ─── Summary header ───────────────────────────────────────────────────────────

function SummaryHeader({ count, total }: { count: number; total: number }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryLeft}>
        <View style={styles.summaryIconWrap}>
          <Ionicons name="cash-outline" size={22} color={DesignColors.primaryBright} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.summaryTitle}>Pending Payouts</Text>
          <Text style={styles.summarySubtitle}>
            {count} request{count !== 1 ? 's' : ''} waiting for disbursement
          </Text>
        </View>
      </View>
      <View style={styles.summaryAmountWrap}>
        <Text style={styles.summaryAmountLabel}>TOTAL</Text>
        <Text style={styles.summaryAmount}>{formatNaira(total)}</Text>
      </View>
    </View>
  );
}

// ─── Bank detail row ──────────────────────────────────────────────────────────

function BankRow({ icon, label, value, copyable }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const { showToast } = useAppToast();

  const handleCopy = async () => {
    const copied = await copyTextToClipboard(value);
    showToast({
      message: copied ? `${label} copied` : 'Failed to copy',
      type: copied ? 'success' : 'error',
    });
  };

  return (
    <View style={styles.bankRow}>
      <View style={styles.bankIconWrap}>
        <Ionicons name={icon} size={13} color={DesignColors.onSurfaceVariant} />
      </View>
      <View style={styles.bankRowText}>
        <Text style={styles.bankLabel}>{label}</Text>
        <Text style={styles.bankValue}>{value}</Text>
      </View>
      {copyable && (
        <Pressable
          onPress={handleCopy}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Copy ${label}`}
          style={styles.copyBtn}
        >
          <Ionicons name="copy-outline" size={15} color={DesignColors.primaryBright} />
        </Pressable>
      )}
    </View>
  );
}

// ─── Payout card ─────────────────────────────────────────────────────────────

function PayoutCard({
  item,
  onDisburse,
  disbursing,
}: {
  item: WithdrawalRequestWithProfile;
  onDisburse: (id: string) => void;
  disbursing: boolean;
}) {
  const name = item.profile?.full_name ?? 'Unknown User';
  const email = item.profile?.email ?? '';

  return (
    <View style={styles.card}>
      {/* ── Top: user identity + amount ── */}
      <View style={styles.cardTop}>
        <View style={styles.cardAvatar}>
          <Text style={styles.cardAvatarText}>{getInitials(name)}</Text>
        </View>
        <View style={styles.cardIdentity}>
          <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
          {!!email && (
            <Text style={styles.cardEmail} numberOfLines={1}>{email}</Text>
          )}
          <View style={styles.cardDateRow}>
            <Ionicons name="time-outline" size={11} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.cardDate}>Requested {formatDate(item.requested_at)}</Text>
          </View>
        </View>
        <View style={styles.cardAmountWrap}>
          <Text style={styles.cardAmountLabel}>AMOUNT</Text>
          <Text style={styles.cardAmount}>{formatNaira(item.amount)}</Text>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.cardDivider} />

      {/* ── Bank details ── */}
      <View style={styles.bankSection}>
        <Text style={styles.bankSectionTitle}>BANK DETAILS</Text>
        <View style={styles.bankRows}>
          <BankRow icon="business-outline" label="Bank" value={item.bank_name} />
          <BankRow icon="keypad-outline" label="Account No." value={item.account_number} copyable />
          <BankRow icon="person-outline" label="Account Name" value={item.account_name} />
        </View>
      </View>

      {/* ── Disburse button ── */}
      <Pressable
        style={[styles.disburseBtn, disbursing && styles.disburseBtnDisabled]}
        onPress={() => onDisburse(item.id)}
        disabled={disbursing}
        accessibilityRole="button"
        accessibilityLabel={`Mark ${name}'s payment as paid`}
      >
        {disbursing ? (
          <ActivityIndicator size="small" color={DesignColors.onPrimary} />
        ) : (
          <>
            <View style={styles.disburseBtnIcon}>
              <Ionicons name="checkmark" size={15} color={DesignColors.primary} />
            </View>
            <Text style={styles.disburseBtnText}>Mark as Paid</Text>
            <Text style={styles.disburseBtnAmount}>{formatNaira(item.amount)}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Ionicons name="checkmark-done-circle" size={40} color={DesignColors.success} />
      </View>
      <Text style={styles.emptyTitle}>All settled</Text>
      <Text style={styles.emptyText}>No pending withdrawal requests right now.</Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function ReferralPayoutsScreen() {
  const { showToast } = useAppToast();
  const { visible, title, message, buttons, showAlert, hideAlert } = useCustomAlert();
  const qc = useQueryClient();
  const [disbursingId, setDisbursingId] = useState<string | null>(null);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } =
    useInfiniteQuery<WithdrawalRequestWithProfile[]>({
      queryKey: ['admin-withdrawal-requests'],
      queryFn: ({ pageParam = 1 }) => fetchPendingWithdrawalRequests(pageParam as number),
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === 30 ? allPages.length + 1 : undefined,
      initialPageParam: 1,
      staleTime: 60 * 1000,
    });

  const allRequests = useMemo(() => data?.pages.flat() ?? [], [data]);
  const totalAmount = allRequests.reduce((s, r) => s + r.amount, 0);

  const { mutateAsync: disburse } = useMutation({
    mutationFn: disburseWithdrawal,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-withdrawal-requests'] }),
  });

  const handleDisburse = useCallback(
    (requestId: string) => {
      const req = allRequests.find((r) => r.id === requestId);
      const name = req?.profile?.full_name ?? 'this user';
      showAlert({
        title: 'Confirm Payment',
        message: `Transfer ${req ? formatNaira(req.amount) : ''} to ${name}?\n\nThis marks all their pending referral earnings as paid and cannot be undone.`,
        buttons: [
          { label: 'Cancel', style: 'cancel' },
          {
            label: 'Confirm & Mark Paid',
            style: 'primary',
            onPress: () => {
              void (async () => {
                setDisbursingId(requestId);
                try {
                  await disburse(requestId);
                  showToast({ message: `Payment to ${name} marked as disbursed.`, type: 'success' });
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'Failed to disburse.';
                  showToast({ message: msg, type: 'error' });
                } finally {
                  setDisbursingId(null);
                }
              })();
            },
          },
        ],
      });
    },
    [allRequests, disburse, showAlert, showToast],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.topBar}>
        <BackButton hasBackground={false} />
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Referral Payouts</Text>
          {!isLoading && allRequests.length > 0 && (
            <View style={styles.topBarBadge}>
              <Text style={styles.topBarBadgeText}>{allRequests.length}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
          <Text style={styles.loadingText}>Loading requests…</Text>
        </View>
      ) : (
        <FlatList
          data={allRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PayoutCard
              item={item}
              onDisburse={handleDisburse}
              disbursing={disbursingId === item.id}
            />
          )}
          ListHeaderComponent={
            allRequests.length > 0 ? (
              <SummaryHeader count={allRequests.length} total={totalAmount} />
            ) : null
          }
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={DesignColors.primaryBright}
                style={{ marginVertical: DesignSpacing.lg }}
              />
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => void refetch()}
              tintColor={DesignColors.primaryBright}
            />
          }
        />
      )}
      <CustomAlert
        visible={visible}
        title={title}
        message={message}
        buttons={buttons}
        onDismiss={hideAlert}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.sm,
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
  },
  topBarTitle: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  topBarBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: DesignColors.onPrimary,
    fontFamily,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.md,
  },
  loadingText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },

  listContent: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
    paddingBottom: 80,
    gap: DesignSpacing.md,
  },

  // Summary card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.xl,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    marginBottom: DesignSpacing.xs,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    flex: 1,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.primaryTintMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { gap: 2, flex: 1 },
  summaryTitle: {
    ...DesignTypography.labelLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
  summarySubtitle: {
    ...DesignTypography.labelSm,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    opacity: 0.75,
  },
  summaryAmountWrap: { alignItems: 'flex-end', gap: 2 },
  summaryAmountLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    opacity: 0.7,
    letterSpacing: 0.8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    letterSpacing: -0.5,
  },

  // Payout card
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignSpacing.md,
    padding: DesignSpacing.md,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardAvatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: DesignColors.primaryBright,
    fontFamily,
  },
  cardIdentity: { flex: 1, gap: 3 },
  cardName: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  cardEmail: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardDate: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  cardAmountWrap: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  cardAmountLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    letterSpacing: 0.8,
    opacity: 0.7,
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: DesignColors.primaryBright,
    fontFamily,
    letterSpacing: -0.5,
  },

  cardDivider: {
    height: 1,
    backgroundColor: DesignColors.borderFaint,
    marginHorizontal: DesignSpacing.md,
  },

  // Bank section
  bankSection: {
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  bankSectionTitle: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    letterSpacing: 1,
    opacity: 0.7,
  },
  bankRows: { gap: 8 },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  bankIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: DesignColors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bankRowText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  bankLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    width: 88,
  },
  bankValue: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
    flex: 1,
  },
  copyBtn: {
    padding: 4,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.primaryTint,
  },

  // Disburse button
  disburseBtn: {
    margin: DesignSpacing.md,
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.lg,
    paddingVertical: 13,
    paddingHorizontal: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  disburseBtnDisabled: { opacity: 0.45 },
  disburseBtnIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DesignColors.primaryTintMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disburseBtnText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
    flex: 1,
  },
  disburseBtnAmount: {
    ...DesignTypography.labelLg,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: DesignSpacing.xl * 3,
    paddingHorizontal: DesignSpacing.xl,
    gap: DesignSpacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.xs,
  },
  emptyTitle: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  emptyText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
});
