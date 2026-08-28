import { StyleSheet, View } from 'react-native';
import { DesignColors } from '@/constants/design';

export function AuthBackgroundBubbles() {
  return (
    <>
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  glowTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: DesignColors.primaryTintMid,
    transform: [{ scale: 1.6 }],
    filter: 'blur(120px)',
    zIndex: 0,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: DesignColors.successContainer,
    transform: [{ scale: 1.6 }],
    filter: 'blur(120px)',
    zIndex: 0,
  },
});
