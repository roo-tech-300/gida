import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  onSayHello: () => void;
  onShare: () => void;
};

export function RoommateProfileActions({ onSayHello, onShare }: Props) {
  return (
    <View style={styles.bar}>
      <Pressable style={styles.shareBtn} onPress={onShare} hitSlop={4}>
        <Ionicons name="share-outline" size={22} color={DesignColors.onSurface} />
      </Pressable>
      <Pressable style={styles.primaryBtn} onPress={onSayHello}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={DesignColors.onPrimary} />
        <Text style={styles.primaryText}>Say Hello</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.md,
    borderTopWidth: 1,
    borderTopColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surface,
  },
  shareBtn: {
    width: 52,
    height: 52,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
  },
  primaryText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
