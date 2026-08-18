import React, { useMemo } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { getTargetOccupancyOptions } from '@/utils/liquidity-math';

interface IntentSelectorProps {
  propertyTier: number;
  selectedIntent: number;
  onSelectIntent: (intent: number) => void;
}

export function IntentSelector({ propertyTier, selectedIntent, onSelectIntent }: IntentSelectorProps) {
  const options = useMemo(() => getTargetOccupancyOptions(propertyTier), [propertyTier]);


  return (
    <View style={styles.container} testID="intent-selector-container">
      <Text style={styles.sectionHeader}>CHOOSE YOUR RESERVATION SIZE</Text>
      <Text style={styles.subtitle}>Choose how many people will live in this {propertyTier}-slot property.</Text>
      {options.map((opt) => {

        const isSelected = selectedIntent === opt.targetOccupancy;
        return (
          <Pressable
            key={opt.targetOccupancy}
            testID={`intent-option-${opt.targetOccupancy}`}
            style={[styles.card, isSelected && styles.activeCard]}
            onPress={() => onSelectIntent(opt.targetOccupancy)}
          >
            <View style={styles.copy}>
              <Text style={[styles.label, isSelected && styles.activeText]}>{opt.label}</Text>
              <Text style={styles.description}>{opt.description}</Text>
            </View>
            {isSelected && (
              <View style={styles.checkBadge} testID={`intent-selected-${opt.targetOccupancy}`}>
                <Ionicons name="checkmark" size={13} color={DesignColors.onPrimary} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DesignSpacing.sm },
  sectionHeader: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, marginBottom: DesignSpacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: 14,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  activeCard: { borderColor: DesignColors.primaryBright, backgroundColor: DesignColors.primaryTint },
  copy: { flex: 1, gap: 2, paddingRight: 4 },
  label: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  activeText: { color: DesignColors.onPrimaryContainer },
  description: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
