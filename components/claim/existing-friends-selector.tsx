import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';

type Props = {
  roommateCount: number;
  value: number;
  onChange: (have: number) => void;
};

export function ExistingFriendsSelector({ roommateCount, value, onChange }: Props) {
  const matched = roommateCount - value;

  return (
    <View style={styles.container}>
      <View style={styles.stepperCard}>
        <Pressable
          style={[styles.stepButton, value === 0 && styles.stepButtonDisabled]}
          disabled={value === 0}
          onPress={() => onChange(value - 1)}
          hitSlop={6}
          accessibilityLabel="Remove a friend"
        >
          <Ionicons name="remove" size={18} color={value === 0 ? DesignColors.onSurfaceVariant : DesignColors.onSurface} />
        </Pressable>
        <View style={styles.stepperCopy}>
          <Text style={styles.stepperLabel}>FRIENDS I&apos;M BRINGING</Text>
          <Text style={styles.stepperValue}>{value}</Text>
        </View>
        <Pressable
          style={[styles.stepButton, value >= roommateCount && styles.stepButtonDisabled]}
          disabled={value >= roommateCount}
          onPress={() => onChange(value + 1)}
          hitSlop={6}
          accessibilityLabel="Add a friend"
        >
          <Ionicons
            name="add"
            size={18}
            color={value >= roommateCount ? DesignColors.onSurfaceVariant : DesignColors.onSurface}
          />
        </Pressable>
      </View>

      <Text style={styles.summary}>
        {matched === 0
          ? 'All your roommates are friends. Gida keeps the group to just you and them.'
          : `Gida will go and look for ${matched} roommate${matched === 1 ? '' : 's'} for you.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DesignSpacing.sm },
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingVertical: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.md,
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: DesignColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: { opacity: 0.4 },
  stepperCopy: { alignItems: 'center', gap: 1 },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  stepperValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: DesignColors.onSurface,
    fontFamily,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
