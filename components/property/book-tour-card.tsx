import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  onPress: () => void;
};

export function BookTourCard({ onPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Book a Tour</Text>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
        <View style={styles.iconBg}>
          <Ionicons name="calendar-outline" size={22} color={DesignColors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Visit This Property</Text>
          <Text style={styles.sub}>Guided inspection with a Gida Agent, or a self-guided exterior check.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={DesignColors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignSpacing.xl,
  },
  sectionTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    marginBottom: DesignSpacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  sub: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 16,
  },
});
