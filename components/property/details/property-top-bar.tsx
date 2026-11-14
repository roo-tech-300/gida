import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { HERO_HEIGHT } from './constants';

type Props = {
  scrollY: Animated.Value;
  title: string;
  saved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
};

function IconButton({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={styles.button}>
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

/** Floats over the photo at first, then turns into a solid bar carrying the listing's name as you scroll. */
export function PropertyTopBar({ scrollY, title, saved, onToggleSave, onShare }: Props) {
  const insets = useSafeAreaInsets();
  const solid = scrollY.interpolate({ inputRange: [HERO_HEIGHT - 150, HERO_HEIGHT - 90], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + DesignSpacing.sm }]} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.solid, { opacity: solid }]} pointerEvents="none" />
      <BackButton />
      <Animated.Text numberOfLines={1} style={[styles.title, { opacity: solid }]}>{title}</Animated.Text>
      <View style={styles.actions}>
        <IconButton
          icon={saved ? 'heart' : 'heart-outline'}
          label={saved ? 'Remove from saved' : 'Save listing'}
          color={saved ? DesignColors.primaryBright : DesignColors.onSurface}
          onPress={onToggleSave}
        />
        <IconButton icon="share-outline" label="Share listing" color={DesignColors.onSurface} onPress={onShare} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.md,
    paddingBottom: DesignSpacing.sm,
  },
  solid: { backgroundColor: DesignColors.surface, borderBottomWidth: 1, borderBottomColor: DesignColors.borderSoft },
  title: { flex: 1, textAlign: 'center', fontFamily, fontSize: 15, fontWeight: '700', color: DesignColors.onSurface },
  actions: { flexDirection: 'row', gap: DesignSpacing.sm },
  button: { width: 40, height: 40, borderRadius: 20, backgroundColor: DesignColors.scrim, alignItems: 'center', justifyContent: 'center' },
});
