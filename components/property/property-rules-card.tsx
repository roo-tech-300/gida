import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  rules: string[];
};

export function PropertyRulesCard({ rules }: Props) {
  if (rules.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerBar} />
        <Text style={styles.header}>HOUSE RULES</Text>
      </View>
      <View style={styles.card}>
        {rules.map((rule, index) => (
          <View key={index} style={[styles.ruleRow, index > 0 && styles.ruleBorder]}>
            <View style={styles.iconBg}>
              <Ionicons name="shield-checkmark-outline" size={16} color={DesignColors.primaryBright} />
            </View>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: DesignSpacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, marginBottom: DesignSpacing.md },
  headerBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: DesignColors.primaryBright },
  header: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.4 },
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.borderFaint,
    paddingHorizontal: DesignSpacing.md,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: DesignSpacing.md, paddingVertical: 14 },
  ruleBorder: { borderTopWidth: 1, borderTopColor: DesignColors.borderFaint },
  iconBg: {
    width: 26,
    height: 26,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  ruleText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, flex: 1, lineHeight: 22 },
});
