import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { getDatePills, TOUR_ADMIN } from '@/dummy/tour-scheduler-mock';
import { TourDatePicker } from './tour-date-picker';
import { TourSlotGrid } from './tour-slot-grid';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function TourSchedulerModal({ propertyId, propertyTitle, propertyLocation }: { propertyId: string; propertyTitle: string; propertyLocation: string }) {
  const datePills = useMemo(() => getDatePills(7), []);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!selectedSlot || isConfirming) return;
    setIsConfirming(true);
    await new Promise((r) => setTimeout(r, 1300));
    setIsConfirming(false);
    const d = datePills[selectedDateIndex].date;
    const formattedDate = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    router.replace(`/property/tour-pass?id=${propertyId}&date=${encodeURIComponent(formattedDate)}&time=${encodeURIComponent(selectedSlot)}`);
  }, [selectedSlot, isConfirming, selectedDateIndex, datePills, propertyId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.handleArea}>
        <View style={styles.handle} />
      </View>
      <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Schedule Your Tour</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle} numberOfLines={1}>{propertyTitle}</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={DesignColors.secondary} />
            <Text style={styles.verifiedText}>Verification Active</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Date</Text>
          <TourDatePicker selectedIndex={selectedDateIndex} onSelect={setSelectedDateIndex} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Available Slots</Text>
          <TourSlotGrid selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
        </View>

        <View style={styles.agentCard}>
          <Image source={TOUR_ADMIN.image} style={styles.agentAvatar} />
          <View style={styles.agentInfo}>
            <Text style={styles.agentLabel}>house admin</Text>
            <Text style={styles.agentName}>{TOUR_ADMIN.name}</Text>
          </View>
          <View style={styles.agentRating}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.ratingText}>{TOUR_ADMIN.rating}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleConfirm}
          disabled={!selectedSlot || isConfirming}
          style={[styles.confirmButton, (!selectedSlot || isConfirming) && styles.confirmButtonDisabled]}
        >
          <Text style={styles.confirmText}>Confirm Tour Booking</Text>
          <Ionicons name="arrow-forward" size={20} color={DesignColors.onPrimary} />
        </Pressable>
      </ScrollView>

      {isConfirming && (
        <View style={styles.loadingOverlay}>
          <Ionicons name="checkmark-done" size={48} color={DesignColors.primary} />
          <Text style={styles.loadingTitle}>Securing your slot...</Text>
          <Text style={styles.loadingSub}>with {TOUR_ADMIN.name}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface }, 
  handleArea: { height: 32, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 44, height: 5, borderRadius: DesignRadius.full, backgroundColor: DesignColors.outlineVariant },
  content: { padding: DesignSpacing.marginMobile, paddingBottom: DesignSpacing.xl * 2, gap: DesignSpacing.lg },
  headline: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, flexWrap: 'wrap' },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, flexShrink: 1 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74, 225, 118, 0.12)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: DesignRadius.full,
  },
  verifiedText: { ...DesignTypography.labelSm, color: DesignColors.secondary, fontFamily, fontWeight: '600' },
  section: { gap: DesignSpacing.sm },
  sectionLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  agentCard: {
    flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md,
    backgroundColor: DesignColors.glassFill, borderRadius: DesignRadius.xl,
    borderWidth: 1, borderColor: DesignColors.cardBorder, padding: DesignSpacing.md,
  },
  agentAvatar: { width: 48, height: 48, borderRadius: DesignRadius.full },
  agentInfo: { flex: 1, gap: 2 },
  agentLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, textTransform: 'uppercase', letterSpacing: 0.8 },
  agentName: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  agentRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  confirmButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryContainer, borderRadius: DesignRadius.xl, height: 56,
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmText: { ...DesignTypography.bodyLg, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: DesignColors.surface, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm },
  loadingTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, marginTop: DesignSpacing.sm },
  loadingSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
});
