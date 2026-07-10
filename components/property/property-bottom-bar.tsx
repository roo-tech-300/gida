import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function PropertyBottomBar({ onBookTour }: { onBookTour?: () => void }) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, DesignSpacing.md) }]}>
      <Pressable onPress={() => setLiked((v) => !v)} style={styles.favButton}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={22}
          color={liked ? DesignColors.secondary : DesignColors.onSurface}
        />
      </Pressable>
      <Pressable onPress={onBookTour} style={styles.ctaButton}>
        <Text style={styles.ctaText}>Book Instant Tour</Text>
        <Ionicons name="arrow-forward" size={20} color={DesignColors.onPrimary} />
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
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.md,
    backgroundColor: DesignColors.surface,
    borderTopWidth: 1,
    borderTopColor: DesignColors.cardBorder,
  },
  favButton: {
    width: 56,
    height: 56,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.xl,
    paddingVertical: 16,
  },
  ctaText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
