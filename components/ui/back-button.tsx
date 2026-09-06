import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { DesignColors } from '@/constants/design';

type Props = {
  onPress?: () => void;
  hasBackground?: boolean;
};

export function BackButton({ onPress, hasBackground = true }: Props) {
  return (
    <Pressable
      onPress={
        onPress ??
        (() => {
          // On web, a refresh / deep link makes the current screen the ONLY route in
          // the stack. router.back() then dispatches GO_BACK with nothing to pop,
          // producing a dev-only warning. Fall back to a real destination instead.
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        })
      }
      style={[styles.btn, !hasBackground && styles.btnPlain]}
    >
      <Ionicons name="arrow-back" size={22} color={DesignColors.onSurface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignColors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPlain: {
    backgroundColor: 'transparent',
  },
});
