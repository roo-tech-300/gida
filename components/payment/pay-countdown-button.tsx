import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignTypography, fontFamily } from '@/constants/design';
import { formatNaira } from '@/utils/format-naira';

type Props = {
  amount: number;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

export function PayCountdownButton({ amount, onPress, disabled = false, testID }: Props) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <Ionicons name="lock-closed" size={16} color={DesignColors.onPrimaryContainer} />
      <Text style={styles.buttonText}>Pay {formatNaira(amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.full,
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
