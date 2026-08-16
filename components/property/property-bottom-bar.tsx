import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  ctaLabel: string;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
  onCtaPress?: () => void;
  onVisitProperty?: () => void;
  showSpinner?: boolean;
};

export function PropertyBottomBar({ ctaLabel, ctaIcon = 'enter-outline', onCtaPress, onVisitProperty, showSpinner = false }: Props) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, DesignSpacing.md) }]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setLiked((v) => !v)}
        style={[styles.favButton, liked && styles.favButtonActive]}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={22}
          color={liked ? DesignColors.primaryBright : DesignColors.onSurface}
        />
      </Pressable>

      <View style={styles.tourWrap}>
        {onVisitProperty && (
          <Pressable accessibilityRole="button" onPress={onVisitProperty} style={styles.tourButton}>
            <Ionicons name="calendar-outline" size={18} color={DesignColors.textPrimary} />
            <Text style={styles.tourText}>Tour</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={showSpinner ? undefined : onCtaPress}
        style={[styles.primaryCtaButton, showSpinner && { opacity: 0.7 }]}
        disabled={showSpinner}
      >
        {showSpinner ? (
          <ActivityIndicator size="small" color={DesignColors.onPrimary} />
        ) : (
          <Ionicons name={ctaIcon} size={18} color={DesignColors.onPrimary} />
        )}
        <Text style={styles.primaryCtaText}>{ctaLabel}</Text>
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
  favButton: {
    width: 48,
    height: 48,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  favButtonActive: {
    borderColor: DesignColors.primaryTintBorder,
    backgroundColor: DesignColors.primaryTint,
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
  primaryCtaText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
