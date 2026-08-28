import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import { styles } from './claim-room-modal.styles';

type Props = {
  step: number;
  totalSteps: number;
  canGoBack: boolean;
  onBack: () => void;
  onClose: () => void;
};

export function WizardHeader({ step, totalSteps, canGoBack, onBack, onClose }: Props) {
  return (
    <View style={styles.header}>
      {canGoBack ? (
        <Pressable onPress={onBack} style={styles.headerSide} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={DesignColors.onSurfaceVariant} />
        </Pressable>
      ) : (
        <View style={styles.headerSide} />
      )}
      <View style={styles.stepWrap}>
        <Text style={styles.stepLabel}>STEP {step} OF {totalSteps}</Text>
        <View style={styles.progressTrack}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <View key={index} style={[styles.progressSegment, index < step && styles.progressSegmentActive]} />
          ))}
        </View>
      </View>
      <Pressable onPress={onClose} style={styles.headerSide} hitSlop={8}>
        <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}
