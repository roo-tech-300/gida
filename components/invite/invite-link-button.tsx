import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';

/** Opens the household's invite screen, where each friend gets a link instead of a code. */
export function InviteLinkButton({ podId, creditId }: { podId: string; creditId?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/property/invite', params: { podId, creditId: creditId ?? '' } })}
      style={styles.button}
      testID="invite-link-btn"
    >
      <Ionicons name="link-outline" size={18} color={DesignColors.primaryFixed} />
      <Text style={styles.text}>Invite friends with a link</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, marginBottom: DesignSpacing.md, borderRadius: DesignRadius.full, borderWidth: 1.5, borderColor: DesignColors.primaryBright },
  text: { fontFamily, fontSize: 14, fontWeight: '700', color: DesignColors.primaryFixed },
});
