import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppToast } from '@/components/ui/toast-card';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type TourPassProps = {
  propertyTitle: string;
  propertyLocation: string;
  date: string;
  time: string;
};

export function TourPassScreen({ propertyTitle, propertyLocation, date, time }: TourPassProps) {
  const { showToast } = useAppToast();

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

                <View style={styles.perforationRow}>
                  <View style={styles.cutout} />
                  <View style={styles.dashedLine} />
                  <View style={styles.cutout} />
                </View>

                <View style={styles.qrSection}>
                  <View style={styles.qrFrame}>
                    <View style={styles.qrGrid}>
                      {qrCells.map((cell, index) => (
                        <View key={`${cell ? 'on' : 'off'}-${index}`} style={[styles.qrCell, cell && styles.qrCellOn]} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.scanText}>Scan at main lobby security desk</Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Pressable
                  style={styles.walletButton}
                  onPress={() => {
                    showToast({ message: 'Added to Apple Wallet', type: 'success' });
                  }}
                >
                  <Text style={styles.walletText}>Add to Apple Wallet</Text>
                </Pressable>
                <Pressable style={styles.closeAction} onPress={() => router.back()}>
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

const qrCells = [
  true, false, true, true, false, true, false, false, true, false,
  false, true, false, false, true, false, true, true, false, true,
  true, true, false, true, false, false, true, false, true, false,
  false, true, true, false, true, true, false, false, true, true,
  true, false, false, true, false, true, true, false, false, true,
  false, true, true, false, true, false, false, true, true, false,
  true, false, false, true, true, false, true, false, false, true,
  false, true, false, false, true, true, false, true, true, false,
  true, false, true, false, false, true, false, true, false, true,
  false, true, true, false, true, false, false, true, true, false,
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  header: { paddingHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.sm, paddingBottom: DesignSpacing.xs },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.06)' },
  content: { flexGrow: 1, paddingHorizontal: DesignSpacing.marginMobile, paddingBottom: DesignSpacing.xl * 2, justifyContent: 'center' },
  backdropCard: {
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.9)',
    backgroundColor: 'rgba(26, 26, 30, 0.92)',
    boxShadow: '0 0 15px rgba(34, 197, 94, 0.3), inset 0 0 2px rgba(34, 197, 94, 0.5)',
  },
  perspective: { padding: DesignSpacing.md },
  passCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(26, 26, 30, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: DesignSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  badge: { ...DesignTypography.labelCaps, color: DesignColors.secondary, fontFamily },
  passTitle: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily, marginTop: DesignSpacing.xs },
  statusBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 185, 84, 0.14)',
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
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.md,
  },
  locationText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, flex: 1 },
  perforationRow: { flexDirection: 'row', alignItems: 'center', height: 16 },
  dashedLine: { flex: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255, 255, 255, 0.2)' },
  cutout: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0, 0, 0, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  qrSection: { alignItems: 'center', gap: DesignSpacing.md, paddingTop: 2, paddingBottom: DesignSpacing.xs },
  qrFrame: { padding: 16, borderRadius: 20, backgroundColor: '#ffffff' },
  qrGrid: { width: 128, height: 128, flexDirection: 'row', flexWrap: 'wrap' },
  qrCell: { width: 12.8, height: 12.8, backgroundColor: '#ffffff' },
  qrCellOn: { backgroundColor: '#111827' },
  scanText: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  walletButton: {
    height: 56,
    width: '100%',
    borderRadius: DesignRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  walletText: { ...DesignTypography.bodyLg, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
  footer: { paddingHorizontal: DesignSpacing.lg, paddingBottom: DesignSpacing.lg, gap: DesignSpacing.md },
  closeAction: { alignItems: 'center', paddingTop: 4, paddingBottom: 2 },
  closeActionText: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
});
