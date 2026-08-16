import { useCallback, type ComponentProps } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAdminTourDetail } from '@/hooks/use-admin-tours';
import { TourStatusChip } from '@/components/property/tour-status-chip';
import { formatTourDate } from '@/utils/tour-availability';
import { openDirectionsInMaps } from '@/utils/open-maps';
import { CompleteTourButton } from './complete-tour-button';
import type { AdminTourDetail } from '@/types/tour-booking';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export function TourDetailScreen({ bookingId }: { bookingId: string }) {
  const { data: detail, isError, isLoading, isRefetching, refetch } = useAdminTourDetail(bookingId);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={8}>
          <Ionicons name="close" size={22} color={DesignColors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Tour details</Text>
        <View style={styles.closeButton} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={DesignColors.primary} />
        </View>
      ) : isError || !detail ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={28} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.errorTitle}>Could not load this tour</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={DesignColors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <PropertyCard detail={detail} />
          <ScheduleCard detail={detail} />
          <StudentCard detail={detail} />
          <CompleteTourButton bookingId={detail.booking.id} status={detail.booking.status} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PropertyCard({ detail }: { detail: AdminTourDetail }) {
  const listing = detail.listing;
  const subtitle = [listing?.location_landmark, listing?.city].filter(Boolean).join(', ');

  return (
    <View style={[styles.card, styles.propertyCard]}>
      {listing?.primary_image ? (
        <Image source={{ uri: listing.primary_image }} style={styles.propertyImage} />
      ) : (
        <View style={styles.propertyImageFallback}>
          <Ionicons name="home-outline" size={30} color={DesignColors.primaryBright} />
        </View>
      )}
      <View style={styles.propertyBody}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {listing?.title ?? 'Unnamed property'}
        </Text>
        {subtitle ? (
          <Text style={styles.propertyMeta} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {listing ? <Text style={styles.propertyPrice}>₦{listing.price_amount.toLocaleString('en-US')}</Text> : null}
        {listing ? (
          <Pressable
            style={styles.directionsRow}
            onPress={() =>
              openDirectionsInMaps({
                latitude: listing.latitude,
                longitude: listing.longitude,
                placeName: listing.title,
                placeArea: subtitle,
              })
            }
          >
            <Ionicons name="navigate-outline" size={14} color={DesignColors.primaryBright} />
            <Text style={styles.directionsText}>Get directions</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ScheduleCard({ detail }: { detail: AdminTourDetail }) {
  const booking = detail.booking;
  const ref = `GIDA-TR-${booking.id.slice(-4).toUpperCase()}`;

  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        <Text style={styles.rowLabel}>Status</Text>
        <TourStatusChip status={booking.status} />
      </View>
      <View style={styles.divider} />
      <InfoRow icon="calendar-outline" label="Date" value={formatTourDate(booking.scheduled_date)} />
      <InfoRow icon="time-outline" label="Time" value={booking.scheduled_time} />
      <InfoRow icon="ticket-outline" label="Reference" value={ref} />
      <InfoRow icon="time-outline" label="Booked" value={formatCreatedDate(booking.created_at)} />
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: IoniconName; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={DesignColors.onSurfaceVariant} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function StudentCard({ detail }: { detail: AdminTourDetail }) {
  const name = detail.student.name;
  const initial = (name ?? 'R').trim().charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.studentBody}>
        <Text style={styles.studentName}>{name ?? 'Gida resident'}</Text>
        <Text style={styles.studentMeta}>Booked for a guided tour</Text>
      </View>
    </View>
  );
}

function formatCreatedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.md, padding: DesignSpacing.lg },
  errorTitle: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: DesignSpacing.lg,
    paddingVertical: 10,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
  },
  retryText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimary, fontFamily, fontWeight: '600' },
  content: { padding: DesignSpacing.marginMobile, gap: DesignSpacing.md, paddingBottom: DesignSpacing.xl * 2 },
  card: {
    backgroundColor: DesignColors.glassFill,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.lg,
    gap: DesignSpacing.md,
  },
  propertyCard: { flexDirection: 'row', alignItems: 'center' },
  propertyImage: {
    width: 72,
    height: 72,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainer,
  },
  propertyImageFallback: {
    width: 72,
    height: 72,
    borderRadius: DesignRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  propertyBody: { flex: 1, gap: 4 },
  propertyTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  propertyMeta: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  propertyPrice: { ...DesignTypography.headlineMd, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  directionsRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.xs, marginTop: 2 },
  directionsText: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: DesignColors.cardBorder },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.borderSoft,
  },
  rowLabel: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, flex: 1 },
  rowValue: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  avatarText: { ...DesignTypography.headlineMd, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  studentBody: { flex: 1, gap: 2 },
  studentName: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  studentMeta: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
});
