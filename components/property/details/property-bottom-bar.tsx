import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import type { BarSummary, BarTone } from '@/utils/property-bar-summary';
import { BAR_HEIGHT } from './constants';

export type BarVariant = 'primary' | 'secondary' | 'disabled';

type Props = {
  summary: BarSummary;
  label: string;
  variant: BarVariant;
  pending: boolean;
  onPress: () => void;
};

const PRIMARY_COLOR: Record<BarTone, string> = {
  price: DesignColors.primaryFixed,
  warn: DesignColors.onSurface,
  paid: DesignColors.success,
  neutral: DesignColors.onSurface,
};

/** The page's one decision: what you owe or have done on the left, one button on the right. */
export function PropertyBottomBar({ summary, label, variant, pending, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const inactive = pending || variant === 'disabled';
  const secondaryColor = summary.tone === 'warn' ? DesignColors.warning : DesignColors.outline;

  return (
    <View style={[styles.bar, { height: BAR_HEIGHT + insets.bottom, paddingBottom: Math.max(insets.bottom, DesignSpacing.sm) }]}>
      <View style={styles.summary}>
        <Text style={[styles.primary, { color: PRIMARY_COLOR[summary.tone] }]} numberOfLines={1} adjustsFontSizeToFit>{summary.primary}</Text>
        {summary.secondary ? <Text style={[styles.secondary, { color: secondaryColor }]} numberOfLines={1}>{summary.secondary}</Text> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: pending }}
        disabled={inactive}
        onPress={onPress}
        style={[styles.button, variant === 'secondary' && styles.buttonSecondary, variant === 'disabled' && styles.buttonDisabled]}
      >
        {pending ? (
          <ActivityIndicator size="small" color={DesignColors.onPrimary} />
        ) : (
          <Text style={[styles.buttonText, variant === 'secondary' && styles.buttonTextSecondary, variant === 'disabled' && styles.buttonTextDisabled]} numberOfLines={1}>
            {label}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingTop: DesignSpacing.sm + 4,
    paddingHorizontal: DesignSpacing.marginMobile,
    backgroundColor: DesignColors.surface,
    borderTopWidth: 1,
    borderTopColor: DesignColors.borderSoft,
  },
  summary: { flex: 1, gap: 2 },
  primary: { fontFamily, fontSize: 20, fontWeight: '800' },
  secondary: { fontFamily, fontSize: 11 },
  button: {
    minWidth: 160,
    maxWidth: 210,
    flexShrink: 0,
    height: 52,
    paddingHorizontal: DesignSpacing.lg,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
  },
  buttonSecondary: { backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1.5, borderColor: DesignColors.primaryTintStrong },
  buttonDisabled: { backgroundColor: DesignColors.surfaceContainerHigh },
  buttonText: { fontFamily, fontSize: 16, fontWeight: '700', color: DesignColors.onPrimary },
  buttonTextSecondary: { color: DesignColors.primaryFixed },
  buttonTextDisabled: { color: DesignColors.outline },
});
