import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { openDirectionsInMaps } from '@/utils/open-maps';

type TourPassProps = {
  propertyTitle: string;
  propertyLocation: string;
  date: string;
  time: string;
  bookingId?: string;
  latitude?: number;
  longitude?: number;
};

export function TourPassScreen({ propertyTitle, propertyLocation, date, time, bookingId, latitude, longitude }: TourPassProps) {
  const bookingReference = bookingId ? `GIDA-TR-${bookingId.slice(-4).toUpperCase()}` : 'GIDA-TR-DEMO';

  const handleGetDirections = () => {
    openDirectionsInMaps({ latitude, longitude, placeName: propertyTitle, placeArea: propertyLocation });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={DesignColors.onSurface} />
        </Pressable>
      </View>

      <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.backdropCard}>
          <View style={styles.perspective}>
            <View style={styles.passCard}>
              <View style={styles.passHeader}>
                <View>
                  <Text style={styles.badge}>Digital Entry Pass</Text>
                  <Text style={styles.passTitle}>{propertyTitle} Tour</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={DesignColors.secondary} />
                </View>
              </View>

              <View style={styles.ticketBody}>
                <View style={styles.metaGrid}>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{date}</Text>
                  </View>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Time</Text>
                    <Text style={styles.metaValue}>{time}</Text>
                  </View>
                </View>

                <View style={styles.locationCard}>
                  <Ionicons name="location-outline" size={18} color={DesignColors.onSurfaceVariant} />
                  <Text style={styles.locationText}>{propertyLocation}</Text>
                </View>

                <Pressable style={styles.directionsButton} onPress={handleGetDirections}>
                  <Ionicons name="navigate-outline" size={16} color={DesignColors.primaryBright} />
                  <Text style={styles.directionsText}>Get directions</Text>
                </Pressable>

                <View style={styles.refRow}>
                  <Ionicons name="ticket-outline" size={16} color={DesignColors.primaryBright} />
                  <Text style={styles.refText}>Booking Ref: {bookingReference}</Text>
                </View>

                <View style={styles.perforationRow}>
                  <View style={styles.cutout} />
                  <View style={styles.dashedLine} />
                  <View style={styles.cutout} />
                </View>
              </View>

              <View style={styles.footer}>
                <Pressable style={styles.closeAction} onPress={() => router.replace('/property/tour-history')}>
                  <Text style={styles.closeActionText}>Close & View History</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  header: { paddingHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.sm, paddingBottom: DesignSpacing.xs },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.borderSoft },
  content: { flexGrow: 1, paddingHorizontal: DesignSpacing.marginMobile, paddingBottom: DesignSpacing.xl * 2, justifyContent: 'center' },
  backdropCard: {
    borderRadius: 36,
    borderWidth: 1,
    borderColor: DesignColors.success,
    backgroundColor: DesignColors.glassOpaque,
    boxShadow: `0 0 15px ${DesignColors.successContainer}, inset 0 0 2px ${DesignColors.successContainer}`,
  },
  perspective: { padding: DesignSpacing.md },
  passCard: {
    borderRadius: 28,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    overflow: 'hidden',
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: DesignSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.cardBorder,
  },
  badge: { ...DesignTypography.labelCaps, color: DesignColors.secondary, fontFamily },
  passTitle: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily, marginTop: DesignSpacing.xs },
  statusBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.successContainer,
  },
  ticketBody: { padding: DesignSpacing.lg, gap: DesignSpacing.lg },
  metaGrid: { flexDirection: 'row', gap: DesignSpacing.md },
  metaBlock: { flex: 1 },
  metaLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, textTransform: 'uppercase' },
  metaValue: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, marginTop: 4 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainer,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.md,
  },
  locationText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, flex: 1 },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryTint,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    paddingVertical: 10,
  },
  directionsText: { ...DesignTypography.labelCaps, color: DesignColors.primaryBright, fontFamily, letterSpacing: 0.8 },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryTint,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 10,
  },
  refText: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, letterSpacing: 0.8 },
  perforationRow: { flexDirection: 'row', alignItems: 'center', height: 16 },
  dashedLine: { flex: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: DesignColors.borderStrong },
  cutout: { width: 32, height: 32, borderRadius: 16, backgroundColor: DesignColors.scrim, borderWidth: 1, borderColor: DesignColors.glassBorder },
  footer: { paddingHorizontal: DesignSpacing.lg, paddingBottom: DesignSpacing.lg, gap: DesignSpacing.md },
  closeAction: { alignItems: 'center', paddingTop: 4, paddingBottom: 2 },
  closeActionText: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
});
