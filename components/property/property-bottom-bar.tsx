import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  ctaLabel: string;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
  onCtaPress?: () => void;
  onVisitProperty?: () => void;
  /** Opens the overflow menu (Save / Enquire). */
  onOpenOverflow?: () => void;
  showSpinner?: boolean;
};

export function PropertyBottomBar({ ctaLabel, ctaIcon = 'enter-outline', onCtaPress, onVisitProperty, onOpenOverflow, showSpinner = false }: Props) {
  const insets = useSafeAreaInsets();
  const showTour = !!onVisitProperty;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, DesignSpacing.md) }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More actions"
        onPress={onOpenOverflow}
        style={styles.overflowButton}
      >
        <Ionicons name="ellipsis-horizontal" size={22} color={DesignColors.onSurface} />
      </Pressable>

      {showTour ? (
        <View style={styles.tourWrap}>
          <Pressable accessibilityRole="button" onPress={onVisitProperty} style={styles.tourButton}>
            <Ionicons name="calendar-outline" size={18} color={DesignColors.textPrimary} />
            <Text style={styles.tourText}>Tour</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={showSpinner ? undefined : onCtaPress}
        style={[styles.primaryCtaButton, showTour && styles.primaryCtaButtonWithTour, showSpinner && { opacity: 0.7 }]}
        disabled={showSpinner}
      >
        {showSpinner ? (
          <ActivityIndicator size="small" color={DesignColors.onPrimary} />
        ) : (
          <Ionicons name={ctaIcon} size={18} color={DesignColors.onPrimary} />
        )}
        {ctaLabel ? <Text style={styles.primaryCtaText}>{ctaLabel}</Text> : null}
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
    gap: 8,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.sm + 4,
    backgroundColor: DesignColors.surface,
    borderTopWidth: 1,
    borderTopColor: DesignColors.borderSoft,
  },
  overflowButton: {
    width: 48,
    height: 48,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  tourWrap: {
    flex: 1,
  },
  tourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    height: 48,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  tourText: { ...DesignTypography.bodyMd, color: DesignColors.textPrimary, fontFamily, fontWeight: '600' },
  primaryCtaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    backgroundColor: DesignColors.primary,
    borderRadius: DesignRadius.full,
  },
  // When Tour is shown, both buttons share the row equally (each flex: 1).
  // When Tour is hidden, the primary CTA keeps flex: 1 but the empty tour
  // slot is gone entirely, so it naturally stretches across the freed space.
  primaryCtaButtonWithTour: {
    flex: 1,
  },
  primaryCtaText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
