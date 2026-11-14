import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';

type Props = { hasActiveTour: boolean; onPress: () => void };

/** Invites the student to look at the place before paying; opens the tour sheet. */
export function PropertyTourCard({ hasActiveTour, onPress }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name="calendar-outline" size={22} color={DesignColors.primaryFixed} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{hasActiveTour ? 'Your tour is booked' : 'See it before you pay'}</Text>
          <Text style={styles.sub}>
            {hasActiveTour ? 'Open your tour pass or change the plan.' : 'Guided or self-guided. Pick a slot that suits you.'}
          </Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
        <Text style={styles.buttonText}>{hasActiveTour ? 'View your tour' : 'Book a tour'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: DesignSpacing.md,
    padding: DesignSpacing.md,
    marginBottom: DesignSpacing.lg,
    borderRadius: DesignRadius.xl - 6,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  top: { flexDirection: 'row', gap: DesignSpacing.md },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primaryTint },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily, fontSize: 16, fontWeight: '700', color: DesignColors.onSurface },
  sub: { fontFamily, fontSize: 13, lineHeight: 18, color: DesignColors.onSurfaceVariant },
  button: {
    alignSelf: 'flex-start',
    height: 36,
    paddingHorizontal: 22,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: DesignColors.primaryBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontFamily, fontSize: 13, fontWeight: '700', color: DesignColors.primaryFixed },
});
