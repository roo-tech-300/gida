import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useTourBookings } from '@/hooks/use-tour-bookings';
import { useAppToast } from '@/components/ui/toast-card';
import { TourStatusChip } from '@/components/property/tour-status-chip';

export default function TourHistoryRoute() {
  const { data: bookings = [], isError, isRefetching, refetch } = useTourBookings();
  const { showToast } = useAppToast();
  const [simRefreshing, setSimRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isError) {
      showToast({ message: 'Failed to load your tours. Pull down to retry.', type: 'error' });
    }
  }, [isError, showToast]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const onRefresh = useCallback(() => {
    if (bookings.length === 0) {
      setSimRefreshing(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setSimRefreshing(false), 1300);
      return;
    }
    refetch();
  }, [bookings.length, refetch]);

  const refreshing = isRefetching || simRefreshing;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={8}>
          <Ionicons name="close" size={22} color={DesignColors.onSurface} />
        </Pressable>
        <Text style={styles.title}>My Tours</Text>
        <View style={styles.closeButton} />
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DesignColors.primary} />}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="home-outline" size={20} color={DesignColors.primaryBright} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.listings?.title ?? 'Property tour'}
              </Text>
              <Text style={styles.cardMeta}>
                {item.listings?.location_landmark ?? 'Gida property'} · {item.scheduled_date}
              </Text>
              <Text style={styles.cardMeta}>{item.scheduled_time}</Text>
            </View>
            <TourStatusChip status={item.status} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={28} color={DesignColors.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyTitle}>No tours yet</Text>
      <Text style={styles.emptyText}>Your upcoming and past guided tours will show up here.</Text>
      <Pressable onPress={() => router.back()} style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>Back to properties</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.borderSoft,
  },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily },
  listContent: { padding: DesignSpacing.marginMobile, gap: DesignSpacing.md, paddingBottom: DesignSpacing.xl * 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    backgroundColor: DesignColors.glassFill,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: DesignRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  cardMeta: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: DesignSpacing.xl * 3, gap: DesignSpacing.sm },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.borderSoft,
    marginBottom: DesignSpacing.xs,
  },
  emptyTitle: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily },
  emptyText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center', maxWidth: 260 },
  emptyButton: {
    marginTop: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.lg,
    paddingVertical: 12,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
  },
  emptyButtonText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimary, fontFamily, fontWeight: '600' },
});
