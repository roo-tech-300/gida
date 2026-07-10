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
      onPress={onPress ?? (() => router.back())}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPlain: {
    backgroundColor: 'transparent',
  },
});
