import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { fetchPendingWithdrawalRequests, disburseWithdrawal } from '@/services/referral-service';
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

// ─── Payout row ───────────────────────────────────────────────────────────────

function PayoutRow({
  item,
  onDisburse,
  disbursing,
}: {
  item: WithdrawalRequestWithProfile;
  onDisburse: (id: string) => void;
  disbursing: boolean;
}) {
  const name = item.profile?.full_name ?? 'User';
  const email = item.profile?.email ?? '';

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
          {!!email && <Text style={styles.rowEmail} numberOfLines={1}>{email}</Text>}
          <Text style={styles.rowDate}>Requested {formatDate(item.requested_at)}</Text>
        </View>
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>{formatNaira(item.amount)}</Text>

        <View style={styles.bankDetails}>
          <Text style={styles.bankText} numberOfLines={1}>{item.bank_name}</Text>
          <Text style={styles.bankText}>{item.account_number}</Text>
          <Text style={styles.bankText} numberOfLines={1}>{item.account_name}</Text>
        </View>

        <Pressable
          style={[styles.disburseBtn, disbursing && styles.disburseBtnDisabled]}
          onPress={() => onDisburse(item.id)}
          disabled={disbursing}
        >
          {disbursing ? (
            <ActivityIndicator size="small" color={DesignColors.onPrimary} />
          ) : (
            <>
              <Ionicons name="checkmark" size={14} color={DesignColors.onPrimary} />
              <Text style={styles.disburseBtnText}>Mark Paid</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ReferralPayoutsScreen() {
  const { showToast } = useAppToast();
  const qc = useQueryClient();
  const [disbursingId, setDisbursingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery<WithdrawalRequestWithProfile[]>({
    queryKey: ['admin-withdrawal-requests'],
    queryFn: ({ pageParam = 1 }) => fetchPendingWithdrawalRequests(pageParam as number),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 30 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 60 * 1000,
  });

  const allRequests = data?.pages.flat() ?? [];

  const { mutateAsync: disburse } = useMutation({
    mutationFn: disburseWithdrawal,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-withdrawal-requests'] });
    },
  });

  const handleDisburse = useCallback(
    (requestId: string) => {
      Alert.alert(
        'Confirm Disbursement',
        'This will mark all pending referral payments for this user as paid. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Paid',
            style: 'destructive',
            onPress: async () => {
              setDisbursingId(requestId);
              try {
                await disburse(requestId);
                showToast({ message: 'Payment marked as disbursed.', type: 'success' });
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to disburse.';
                showToast({ message: msg, type: 'error' });
              } finally {
                setDisbursingId(null);
              }
            },
          },
        ],
      );
    },
    [disburse, showToast],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Referral Payouts</Text>
          <View style={styles.topBarSpacer} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <BackButton hasBackground={false} />
        <Text style={styles.topBarTitle}>Referral Payouts</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {allRequests.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {allRequests.length} pending request{allRequests.length !== 1 ? 's' : ''} ·{' '}
            {formatNaira(allRequests.reduce((s, r) => s + r.amount, 0))} total
          </Text>
        </View>
      )}

      <FlatList
        data={allRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PayoutRow
            item={item}
            onDisburse={handleDisburse}
            disbursing={disbursingId === item.id}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={44} color={DesignColors.success} />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>No pending withdrawal requests.</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={DesignColors.primaryBright} style={{ marginVertical: 16 }} />
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.divider} />}
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
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.sm,
    gap: DesignSpacing.md,
  },
  topBarTitle: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily, flex: 1 },
  topBarSpacer: { width: 40 },

  summaryBar: {
    backgroundColor: DesignColors.warningContainer,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.borderFaint,
  },
  summaryText: { ...DesignTypography.labelSm, color: DesignColors.warning, fontFamily, fontWeight: '700' },

  listContent: { paddingBottom: 60 },

  row: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.md,
    gap: DesignSpacing.md,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: DesignSpacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...DesignTypography.labelLg, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  rowEmail: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  rowDate: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },

  rowRight: { gap: DesignSpacing.sm },
  rowAmount: { fontSize: 22, fontWeight: '800', color: DesignColors.onSurface, fontFamily },
  bankDetails: {
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.sm,
    gap: 2,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  bankText: { ...DesignTypography.labelSm, color: DesignColors.onSurface, fontFamily },

  disburseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.xs,
    backgroundColor: DesignColors.primary,
    borderRadius: DesignRadius.full,
    paddingVertical: 10,
    paddingHorizontal: DesignSpacing.md,
  },
  disburseBtnDisabled: { opacity: 0.5 },
  disburseBtnText: { ...DesignTypography.labelSm, color: DesignColors.onPrimary, fontFamily, fontWeight: '700' },

  divider: { height: 1, backgroundColor: DesignColors.borderFaint, marginHorizontal: DesignSpacing.marginMobile },

  emptyState: {
    alignItems: 'center',
    paddingVertical: DesignSpacing.xl * 3,
    paddingHorizontal: DesignSpacing.xl,
    gap: DesignSpacing.sm,
  },
  emptyTitle: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily },
  emptyText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
});
