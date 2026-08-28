import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';

type Props = {
  capacity: number;
  value: number;
  onChange: (roommates: number) => void;
};

const MAX_PREVIEW_ICONS = 5;

export function GroupSizeSelector({ capacity, value, onChange }: Props) {
  const options = Array.from({ length: capacity - 1 }, (_, index) => index + 1);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {options.map((count) => {
          const selected = value === count;
          const groupSize = count + 1;
          const visibleIcons = Math.min(groupSize, MAX_PREVIEW_ICONS);
          const extra = groupSize - visibleIcons;

          return (
            <Pressable
              key={count}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => onChange(count)}
              testID={`group-size-${count}`}
            >
              {selected && (
                <View style={styles.check}>
                  <Ionicons name="checkmark" size={13} color={DesignColors.onPrimary} />
                </View>
              )}
              <Text style={[styles.count, selected && styles.countSelected]}>{count}</Text>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {count === 1 ? 'roommate' : 'roommates'}
              </Text>
              <View style={styles.preview}>
                {Array.from({ length: visibleIcons }, (_, index) => (
                  <Ionicons
                    key={index}
                    name="person"
                    size={13}
                    color={selected ? DesignColors.primaryBright : DesignColors.onSurfaceVariant}
                  />
                ))}
                {extra > 0 && <Text style={styles.extra}>+{extra}</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.total}>{value + 1} people in this group</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DesignSpacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  card: {
    flexGrow: 1,
    flexBasis: '46%',
    alignItems: 'center',
    gap: 3,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingVertical: DesignSpacing.md,
  },
  cardSelected: {
    backgroundColor: DesignColors.primaryTint,
    borderColor: DesignColors.primaryBright,
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: DesignColors.onSurface,
    fontFamily,
  },
  countSelected: { color: DesignColors.onPrimaryContainer },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  labelSelected: { color: DesignColors.onPrimaryContainer },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  extra: {
    fontSize: 11,
    fontWeight: '700',
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  total: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.primaryBright,
    fontFamily,
  },
});
