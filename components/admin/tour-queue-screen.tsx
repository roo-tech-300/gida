import { useEffect } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAdminTours } from '@/hooks/use-admin-tours';
import { useRealtimeTourAlerts } from '@/hooks/use-tour-realtime';
import { TourStatusChip } from '@/components/property/tour-status-chip';
import { formatTourDate } from '@/utils/tour-availability';
import type { AdminTour } from '@/types/tour-booking';

export function TourQueueScreen() {
  const { data: tours = [], isError, isRefetching, refetch } = useAdminTours();
  const { unread, clearUnread } = useRealtimeTourAlerts();

  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="close" size={22} color={DesignColors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Tours</Text>
        <View style={styles.iconButton}>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={DesignColors.primary} />}
        ListEmptyComponent={<EmptyState hasError={isError} />}
        renderItem={({ item }) => <TourCard tour={item} />}
      />
    </SafeAreaView>
  );
}

function TourCard({ tour }: { tour: AdminTour }) {
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/admin/tour/${tour.id}`)}>
      {tour.listings?.primary_image ? (
        <Image source={{ uri: tour.listings.primary_image }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImageFallback}>
          <Ionicons name="home-outline" size={20} color={DesignColors.primaryBright} />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {tour.listings?.title ?? 'Unnamed property'}
          </Text>
          <TourStatusChip status={tour.status} />
        </View>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {tour.listings?.location_landmark ?? 'Gida property'} · {formatTourDate(tour.scheduled_date)}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {tour.scheduled_time} · {tour.student_name ?? 'Resident'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
    </Pressable>
  );
}

function EmptyState({ hasError }: { hasError: boolean }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={28} color={DesignColors.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyTitle}>{hasError ? 'Could not load tours' : 'No tours yet'}</Text>
      <Text style={styles.emptyText}>
        {hasError ? 'Pull down to retry.' : 'Guided tours booked for your properties will appear here.'}
      </Text>
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
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.borderSoft,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
  },
  badgeText: { ...DesignTypography.labelSm, color: DesignColors.onPrimary, fontFamily, fontWeight: '700', fontSize: 10 },
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
  cardImage: {
    width: 48,
    height: 48,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainer,
  },
  cardImageFallback: {
    width: 48,
    height: 48,
    borderRadius: DesignRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  cardBody: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  cardTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '600', flex: 1 },
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
  emptyText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    maxWidth: 280,
  },
});
