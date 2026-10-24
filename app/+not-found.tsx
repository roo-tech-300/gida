import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export default function NotFound() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="compass-outline" size={40} color={DesignColors.onSurfaceVariant} />
        </View>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>
          This link does not exist or may have expired.
        </Text>
        <Pressable style={styles.btn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.btnText}>Go to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignSpacing.xl,
    gap: DesignSpacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.xs,
  },
  title: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
  btn: {
    marginTop: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.xl,
    paddingVertical: 14,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryContainer,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  btnText: {
    ...DesignTypography.labelLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
