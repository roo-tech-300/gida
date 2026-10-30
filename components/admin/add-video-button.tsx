import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { LISTING_VIDEO_LIMITS } from '@/constants/listing-video';

type Props = {
  onPress: () => void;
  disabled: boolean;
  atLimit: boolean;
};

export function AddVideoButton({ onPress, disabled, atLimit }: Props) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Ionicons name="videocam-outline" size={20} color={DesignColors.onPrimaryContainer} />
      <Text style={styles.text}>
        {atLimit ? `Limit of ${LISTING_VIDEO_LIMITS.maxPerListing} videos reached` : 'Add walkthrough video'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: 14,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.primaryContainer,
  },
  disabled: { opacity: 0.5 },
  text: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
});
