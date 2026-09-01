import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function TourAdminBlockedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-outline" size={40} color={DesignColors.primaryBright} />
        </View>
        <Text style={styles.title}>Tours aren&apos;t available right now</Text>
        <Text style={styles.subtitle}>
          We couldn&apos;t load the house admin for this property. Please try again in a moment.
        </Text>
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}>
          <Ionicons name="refresh" size={18} color={DesignColors.onPrimary} />
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backText}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignSpacing.marginMobile,
    gap: DesignSpacing.md,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
    marginBottom: DesignSpacing.xs,
  },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700', textAlign: 'center' },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
    marginTop: DesignSpacing.sm,
  },
  retryPressed: { opacity: 0.85 },
  retryText: { ...DesignTypography.bodyLg, color: DesignColors.onPrimary, fontFamily, fontWeight: '700' },
  backLink: { paddingVertical: DesignSpacing.sm },
  backText: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, fontWeight: '600' },
});
