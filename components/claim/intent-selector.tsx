import React, { useMemo } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { getTargetOccupancyOptions } from '@/utils/liquidity-math';

interface IntentSelectorProps {
  propertyTier: number;
  selectedIntent: number;
  onSelectIntent: (intent: number) => void;
  isFriendMode?: boolean;
}

export function IntentSelector({ propertyTier, selectedIntent, onSelectIntent, isFriendMode = false }: IntentSelectorProps) {
  const options = useMemo(() => getTargetOccupancyOptions(propertyTier), [propertyTier]);


  return (
    <View style={styles.container} testID="intent-selector-container">
      <Text style={styles.sectionHeader}>CHOOSE YOUR RESERVATION SIZE</Text>
      <Text style={styles.subtitle}>Choose how many slots to secure in this {propertyTier}-slot property.</Text>
      {options.map((opt) => {

        const isSelected = selectedIntent === opt.targetOccupancy;
        return (
          <Pressable
            key={opt.targetOccupancy}
            testID={`intent-option-${opt.targetOccupancy}`}
            style={[styles.card, isSelected && styles.activeCard]}
            onPress={() => onSelectIntent(opt.targetOccupancy)}
          >
            <View style={styles.row}>
              <Text style={[styles.label, isSelected && styles.activeText]}>{opt.label}</Text>
            </View>
            <Text style={styles.description}>{opt.description}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DesignSpacing.sm, marginVertical: DesignSpacing.sm },
  sectionHeader: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, marginBottom: DesignSpacing.xs },
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: 4,
  },
  activeCard: { borderColor: DesignColors.primaryBright, backgroundColor: DesignColors.primaryContainer },
  disabledCard: { opacity: 0.45, backgroundColor: DesignColors.surfaceContainerLowest },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  activeText: { color: DesignColors.onPrimaryContainer },
  description: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  badgeText: { ...DesignTypography.labelSm, color: DesignColors.error, fontWeight: '700' },
  reasonText: { ...DesignTypography.labelSm, color: DesignColors.error, marginTop: 2 },
});
