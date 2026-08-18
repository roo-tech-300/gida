import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { BackButton } from '@/components/ui/back-button';
import { useUserSlotCredits } from '@/hooks/use-liquidity';

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-US')}`;

export function BookingConfirmationScreen({ creditId }: { creditId: string }) {
  const router = useRouter();
  const { data: credits, isLoading } = useUserSlotCredits();
  const credit = credits?.find((c) => c.id === creditId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Booking</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!credit) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.topBarTitle}>Booking</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={28} color={DesignColors.error} />
          <Text style={styles.mutedText}>Booking not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSolo = credit.target_occupancy === 1;
  const estateName = credit.estate?.name || 'Gida Campus Residence';
  const amount = credit.amount_paid ?? 0;
  const occupancyText = isSolo
    ? 'Entire property secured — this space is all yours.'
    : `${credit.target_occupancy} slots secured. Head to the lobby to complete your roommate group.`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <BackButton hasBackground={false} />
        <Text style={styles.topBarTitle}>Booking</Text>
      </View>

      <ScrollView bounces={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark" size={44} color={DesignColors.surface} />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed</Text>
          <Text style={styles.successSubtitle}>Your spot is secured and your payment is complete.</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>PROPERTY</Text>
          <Text style={styles.summaryTitle} numberOfLines={2}>{estateName}</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Paid</Text>
            <Text style={styles.rowValue}>{formatNaira(amount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={styles.rowStatus}>Paid & Active</Text>
          </View>
        </View>

        <View style={styles.occupancyCard}>
          <Ionicons
            name={isSolo ? 'home-outline' : 'people-outline'}
            size={20}
            color={DesignColors.primaryBright}
          />
          <View style={styles.occupancyTextWrap}>
            <Text style={styles.occupancyTitle}>{isSolo ? 'Solo Booking' : 'Group Booking'}</Text>
            <Text style={styles.occupancyDesc}>{occupancyText}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/explore')} testID="booking-back-to-properties">
          <Text style={styles.primaryText}>Back to Properties</Text>
        </Pressable>
        {!isSolo && (
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/property/lobby')} testID="booking-go-to-lobby">
            <Text style={styles.secondaryText}>Go to Lobby</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surface },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm },
  topBarTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700', fontSize: 17 },
  content: { padding: DesignSpacing.md, paddingBottom: DesignSpacing.xl, gap: DesignSpacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.md, padding: DesignSpacing.lg },
  hero: { alignItems: 'center', gap: DesignSpacing.sm, paddingTop: DesignSpacing.md },
  successBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: DesignColors.secondary, alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '800' },
  successSubtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
  summaryCard: { backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.md, borderWidth: 1, borderColor: DesignColors.cardBorder, padding: DesignSpacing.lg, gap: DesignSpacing.sm },
  summaryLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  summaryTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  divider: { height: 1, backgroundColor: DesignColors.cardBorder, marginVertical: DesignSpacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  rowValue: { ...DesignTypography.bodyLg, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },
  rowStatus: { ...DesignTypography.bodyLg, color: DesignColors.secondary, fontFamily, fontWeight: '700' },
  occupancyCard: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.md, borderWidth: 1, borderColor: DesignColors.cardBorder, padding: DesignSpacing.md },
  occupancyTextWrap: { flex: 1, gap: 2 },
  occupancyTitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  occupancyDesc: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20 },
  footer: { padding: DesignSpacing.md, paddingTop: DesignSpacing.xs, gap: DesignSpacing.sm },
  primaryButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primaryContainer, borderRadius: DesignRadius.xl, paddingVertical: 16 },
  primaryText: { ...DesignTypography.bodyLg, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.xl, paddingVertical: 14, borderWidth: 1, borderColor: DesignColors.cardBorder },
  secondaryText: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  mutedText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
});
