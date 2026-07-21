import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  onBookTour?: () => void;
  onApplyListing?: () => void;
  hasActiveClaim?: boolean;
};

export function PropertyBottomBar({ onBookTour, onApplyListing, hasActiveClaim }: Props) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, DesignSpacing.md) }]}>
      <Pressable onPress={() => setLiked((v) => !v)} style={styles.favButton}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={20}
          color={liked ? DesignColors.secondary : DesignColors.onSurface}
        />
      </Pressable>

      <Pressable onPress={onBookTour} style={styles.secondaryCtaButton}>
        <Ionicons name="calendar-outline" size={18} color={DesignColors.onSurface} />
        <Text style={styles.secondaryCtaText}>Book Tour</Text>
      </Pressable>

      <Pressable onPress={onApplyListing} style={styles.primaryCtaButton}>
        <Ionicons name={hasActiveClaim ? 'eye-outline' : 'enter-outline'} size={18} color={DesignColors.onPrimaryContainer} />
        <Text style={styles.primaryCtaText}>{hasActiveClaim ? 'View Claim' : 'Claim Room'}</Text>
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
    borderTopColor: DesignColors.cardBorder,
  },
  favButton: {
    width: 48,
    height: 48,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  secondaryCtaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    paddingVertical: 14,
  },
  secondaryCtaText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  primaryCtaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.xl,
    paddingVertical: 14,
  },
  primaryCtaText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
