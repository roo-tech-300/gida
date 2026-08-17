import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function JoinGroupCard() {
  const openJoin = () => router.push('/property/join-with-code');

  return (
    <Pressable style={styles.card} onPress={openJoin} accessibilityRole="button" testID="join-group-card">
      <View style={styles.iconWrap}>
        <Ionicons name="link-outline" size={22} color={DesignColors.primaryBright} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Have an invite code?</Text>
        <Text style={styles.subtitle}>Join your friend&apos;s group with their invite code.</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    marginHorizontal: DesignSpacing.marginMobile,
    backgroundColor: DesignColors.primaryTint,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    padding: DesignSpacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontWeight: '700', fontFamily },
  subtitle: { fontSize: 12, lineHeight: 16, color: DesignColors.onSurfaceVariant, fontFamily },
});
