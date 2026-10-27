import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';

export function AddPlaceAuthGate() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="location-outline" size={32} color={DesignColors.primary} />
        </View>

        <Text style={styles.title}>Sign in to add a place</Text>
        <Text style={styles.description}>
          Discover is student and community curated. Sign in with your account to publish and manage campus spots.
        </Text>

        <View style={styles.buttonStack}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/login')}
            style={[styles.button, styles.primaryButton]}
          >
            <Text style={styles.primaryText}>Sign in with Gida</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[styles.button, styles.cancelButton]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: DesignSpacing.marginMobile,
  },
  card: {
    alignItems: 'center',
    padding: DesignSpacing.xl,
    borderRadius: DesignRadius.xl,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
    marginBottom: DesignSpacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
    marginBottom: DesignSpacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: DesignColors.textSecondary,
    fontFamily,
    textAlign: 'center',
    marginBottom: DesignSpacing.xl,
  },
  buttonStack: {
    width: '100%',
    gap: DesignSpacing.sm,
  },
  button: {
    height: 48,
    borderRadius: DesignRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: DesignColors.primary,
  },
  cancelButton: {
    backgroundColor: DesignColors.surfaceContainer,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: DesignColors.onPrimary,
    fontFamily,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignColors.textSecondary,
    fontFamily,
  },
});
