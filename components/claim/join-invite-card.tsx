import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import { styles } from './claim-room-modal.styles';

type Props = {
  onPress: () => void;
};

export function JoinInviteCard({ onPress }: Props) {
  return (
    <>
      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>
      <Pressable style={styles.invitedBtn} onPress={onPress} testID="join-invited-btn">
        <View style={styles.invitedIcon}>
          <Ionicons name="gift-outline" size={20} color={DesignColors.primaryBright} />
        </View>
        <View style={styles.invitedCopy}>
          <Text style={styles.invitedTitle}>My friend invited me</Text>
          <Text style={styles.invitedDesc}>Join an existing group with their invite code.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
      </Pressable>
    </>
  );
}
