import { useCallback, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Mode = 'listings' | 'roommates';

export type FeedModeSelectorRef = {
  open: () => void;
};

type Props = {
  currentMode: Mode;
  onSelectMode: (mode: Mode) => void;
  onDismiss: () => void;
};

const CARD_ITEMS: Record<Mode, { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }> = {
  listings: { icon: 'business-outline', title: 'Find a Space', sub: 'Explore rooms & hostels' },
  roommates: { icon: 'people-outline', title: 'Find a Peer', sub: 'Find compatible roommates' },
};

function SwitcherCard({ mode, isActive, onPress }: { mode: Mode; isActive: boolean; onPress: () => void }) {
  const info = CARD_ITEMS[mode];
  return (
    <Pressable onPress={onPress} style={[styles.card, isActive ? styles.cardActive : styles.cardInactive]}>
      <View style={styles.cardLeft}>
        <View style={[styles.cardIconWrap, isActive ? styles.iconWrapActive : styles.iconWrapInactive]}>
          <Ionicons name={info.icon} size={28} color={isActive ? DesignColors.onPrimaryContainer : DesignColors.primary} />
        </View>
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, isActive ? styles.titleActive : styles.titleInactive]}>{info.title}</Text>
          <Text style={[styles.cardSub, isActive ? styles.subActive : styles.subInactive]}>{info.sub}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={isActive ? DesignColors.onPrimaryContainer : DesignColors.onSurfaceVariant} style={{ marginLeft: DesignSpacing.md }} />
    </Pressable>
  );
}

export const FeedModeSelector = forwardRef<FeedModeSelectorRef, Props>(function FeedModeSelector(
  { currentMode, onSelectMode, onDismiss },
  ref,
) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(false);
  const anim = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback(
    (open: boolean) => {
      isOpenRef.current = open;
      setIsOpen(open);
      Animated.timing(anim, {
        toValue: open ? 1 : 0,
        duration: 450,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start();
      if (!open) onDismiss();
    },
    [anim, onDismiss],
  );

  useImperativeHandle(ref, () => ({
    open: () => animateTo(true),
  }), [animateTo]);

  const overlayPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, g) => isOpenRef.current && Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (!isOpenRef.current) return;
        const next = 1 + g.dy / 400;
        anim.setValue(Math.max(0, Math.min(1, next)));
      },
      onPanResponderRelease: (_, g) => {
        if (!isOpenRef.current) return;
        if (g.dy < -60 || g.vy < -0.5) animateTo(false);
        else animateTo(true);
      },
    }),
  ).current;

  const slideY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-900, 0],
  });

  const select = useCallback(
    (mode: Mode) => {
      animateTo(false);
      onSelectMode(mode);
    },
    [animateTo, onSelectMode],
  );

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Animated.View
        style={[styles.overlay, { transform: [{ translateY: slideY }], paddingTop: insets.top }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
        {...overlayPan.panHandlers}
      >
        <View style={styles.overlayContent}>
          <View style={styles.headerSection}>
            <Text style={styles.heading}>Switch Context</Text>
            <Text style={styles.subheading}>What are you looking for today at FUTMinna?</Text>
          </View>

          <View style={styles.cardsSection}>
            <SwitcherCard mode="listings" isActive={currentMode === 'listings'} onPress={() => select('listings')} />
            <SwitcherCard mode="roommates" isActive={currentMode === 'roommates'} onPress={() => select('roommates')} />
          </View>
        </View>

        <Pressable onPress={() => animateTo(false)} style={styles.closeArea}>
          <Text style={styles.closeLabel}>Swipe up to close</Text>
          <View style={styles.closePill} />
        </Pressable>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 200, overflow: 'hidden', backgroundColor: '#000000' },
  overlayContent: { flex: 1, paddingHorizontal: DesignSpacing.marginMobile, justifyContent: 'center', gap: 32 },
  headerSection: { gap: 8 },
  heading: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily },
  subheading: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  cardsSection: { gap: DesignSpacing.md },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: DesignSpacing.lg, borderRadius: DesignRadius.lg },
  cardActive: { backgroundColor: DesignColors.primaryContainer },
  cardInactive: { backgroundColor: 'rgba(53, 52, 55, 0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, flex: 1 },
  cardIconWrap: { width: 56, height: 56, borderRadius: DesignRadius.lg, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  iconWrapInactive: { backgroundColor: 'rgba(195, 192, 255, 0.1)' },
  cardText: { gap: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', fontFamily },
  titleActive: { color: DesignColors.onPrimaryContainer },
  titleInactive: { color: DesignColors.onSurface },
  cardSub: { fontSize: 14, fontFamily },
  subActive: { color: DesignColors.onPrimaryContainer, opacity: 0.8 },
  subInactive: { color: DesignColors.onSurfaceVariant, opacity: 0.6 },
  closeArea: { alignItems: 'center', paddingBottom: 40, paddingTop: 24, gap: 6 },
  closeLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)', fontFamily, textTransform: 'uppercase' },
  closePill: { width: 32, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' },
});
