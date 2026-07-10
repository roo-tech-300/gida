import { StyleSheet, View } from 'react-native';

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
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
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
    backgroundColor: 'rgba(74, 225, 118, 0.05)',
    transform: [{ scale: 1.6 }],
    filter: 'blur(120px)',
    zIndex: 0,
  },
});
