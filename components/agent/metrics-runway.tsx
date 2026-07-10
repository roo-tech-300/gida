import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  showVerificationPrompt: boolean;
};

export function MetricsRunway({ showVerificationPrompt }: Props) {
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={160}
        decelerationRate="fast"
        contentContainerStyle={styles.metricsContent}
      >
        <View style={styles.metricCard}>
          <BlurView intensity={20} tint="dark" style={styles.glassBlur} />
          <Text style={styles.metricLabel}>Active Lodges</Text>
          <Text style={styles.metricValue}>—</Text>
        </View>
        <View style={styles.metricCard}>
          <BlurView intensity={20} tint="dark" style={styles.glassBlur} />
          <Text style={styles.metricLabel}>Pending Apps</Text>
          <Text style={styles.metricValue}>—</Text>
        </View>
      </ScrollView>

      {showVerificationPrompt && (
        <Pressable style={styles.verifyBanner}>
          <BlurView intensity={20} tint="dark" style={styles.glassBlur} />
          <View style={styles.verifyContent}>
            <View style={styles.verifyIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={22} color={DesignColors.error} />
            </View>
            <View style={styles.verifyText}>
              <Text style={styles.verifyTitle}>Get Your Profile Verified</Text>
              <Text style={styles.verifyDesc}>
                Verified agents appear higher in search results and build trust.
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={DesignColors.error} />
          </View>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  metricsContent: {
    gap: DesignSpacing.md,
  },
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  metricCard: {
    width: 144,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.lg,
    backgroundColor: 'rgba(24,24,28,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    gap: 4,
  },
  metricLabel: {
    ...DesignTypography.labelCaps,
    fontSize: 10,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  metricValue: {
    ...DesignTypography.headlineMd,
    fontSize: 24,
    color: DesignColors.onSurface,
    fontFamily,
  },
  verifyBanner: {
    borderRadius: DesignRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(24,24,28,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  verifyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  verifyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,180,171,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyText: {
    flex: 1,
    gap: 2,
  },
  verifyTitle: {
    ...DesignTypography.bodyLg,
    fontWeight: '600',
    color: DesignColors.onSurface,
    fontFamily,
  },
  verifyDesc: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
