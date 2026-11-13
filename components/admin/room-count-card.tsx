import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { WebBlurView } from '@/components/ui/web-blur-view';
import { DesignColors } from '@/constants/design';

import { styles } from './create-listing-core-specs-screen.styles';

type Props = {
  label: string;
  value: number;
  /** Smallest allowed count. */
  min?: number;
  onChange: (next: number) => void;
};

/** "Bedrooms 02 [-] [+]" stepper card used while creating a flat listing. */
export function RoomCountCard({ label, value, min = 1, onChange }: Props) {
  return (
    <View style={[styles.roomCard, { flex: 1 }]}>
      <WebBlurView intensity={25} tint="dark" style={styles.roomCardBlur} />
      <Text style={styles.roomLabel}>{label}</Text>
      <View style={styles.roomStepper}>
        <Pressable
          style={styles.roomBtn}
          onPress={() => onChange(Math.max(min, value - 1))}
          accessibilityRole="button"
          accessibilityLabel={`Fewer ${label.toLowerCase()}`}
        >
          <Ionicons name="remove" size={18} color={DesignColors.primary} />
        </Pressable>
        <Text style={styles.roomCount}>{String(value).padStart(2, '0')}</Text>
        <Pressable
          style={styles.roomBtn}
          onPress={() => onChange(value + 1)}
          accessibilityRole="button"
          accessibilityLabel={`More ${label.toLowerCase()}`}
        >
          <Ionicons name="add" size={18} color={DesignColors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
