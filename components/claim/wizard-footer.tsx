import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import { styles } from './claim-room-modal.styles';

type Props = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
};

export function WizardFooter({ label, icon, loading, disabled, onPress }: Props) {
  return (
    <View style={styles.footer}>
      <Pressable style={[styles.footerBtn, (disabled || loading) && styles.footerBtnDisabled]} onPress={onPress} disabled={disabled || loading}>
        {loading ? (
          <ActivityIndicator color={DesignColors.onPrimary} />
        ) : (
          <View style={styles.footerBtnRow}>
            <Text style={styles.footerBtnText}>{label}</Text>
            {icon && <Ionicons name={icon} size={16} color={DesignColors.onPrimary} />}
          </View>
        )}
      </Pressable>
    </View>
  );
}
