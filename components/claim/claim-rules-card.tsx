import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  rules: string[];
  maxRoommates: number;
};

export function ClaimRulesCard({ rules, maxRoommates }: Props) {
  const effectiveMax = maxRoommates >= 999 ? 'No limit' : maxRoommates;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="document-text-outline" size={18} color={DesignColors.primaryBright} />
        <Text style={styles.title}>House Rules</Text>
      </View>

      <View style={styles.capacityRow}>
        <Ionicons name="people-outline" size={16} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.capacityText}>
          Max roommates allowed: <Text style={styles.capacityValue}>{effectiveMax}</Text>
        </Text>
      </View>

      {rules.length > 0 && (
        <View style={styles.rulesList}>
          {rules.map((rule, i) => (
            <View key={`${i}`} style={styles.ruleRow}>
              <Ionicons name="checkmark-circle" size={14} color={DesignColors.primaryBright} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  title: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.sm,
    padding: DesignSpacing.sm,
  },
  capacityText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  capacityValue: {
    color: DesignColors.onPrimaryContainer,
    fontWeight: '700',
  },
  rulesList: {
    gap: 6,
    marginTop: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ruleText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
});
