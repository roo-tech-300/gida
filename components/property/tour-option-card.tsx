import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import { styles } from './book-tour-modal.styles';

export function TourOptionCard({
  icon,
  label,
  title,
  description,
  feeLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  title: string;
  description: string;
  feeLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
    >
      <View style={styles.optionAccent} />
      <View style={styles.optionIconBg}>
        <Ionicons name={icon} size={20} color={DesignColors.primaryBright} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDesc}>{description}</Text>
        {feeLabel ? (
          <View style={styles.feeChip}>
            <Text style={styles.feeChipText}>{feeLabel}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
    </Pressable>
  );
}
