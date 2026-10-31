import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, fontFamily } from '@/constants/design';

export function GalleryTopBar({ index, total, onClose }: { index: number; total: number; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topBar, { top: insets.top }]}>
      <Pressable onPress={onClose} style={styles.closeBtn}>
        <Ionicons name="close" size={24} color={DesignColors.onSurface} />
      </Pressable>
      <Text style={styles.counter}>
        {index + 1} / {total}
      </Text>
      <View style={styles.actionGhost} />
    </View>
  );
}

export function GalleryBottomBadge({ index, total }: { index: number; total: number }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomBadge, { bottom: Math.max(insets.bottom + 16, 24) }]}>
      <Text style={styles.bottomBadgeText}>
        {index + 1} of {total}
      </Text>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DesignColors.scrim,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignColors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    color: DesignColors.onSurface,
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  actionGhost: { width: 40 },
  bottomBadge: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 10,
  },
  bottomBadgeText: {
    color: DesignColors.onSurface,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DesignColors.borderStrong,
  },
  dotActive: {
    width: 24,
    backgroundColor: DesignColors.primary,
  },
});
