import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { getInitials } from '@/utils/initials';

type Props = {
  name?: string;
  avatarUrl?: string | null;
  onBack: () => void;
};

export function MessageChatHeader({ name, avatarUrl, onBack }: Props) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={26} color={DesignColors.onSurface} />
      </Pressable>

      <View style={styles.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{getInitials(name ?? 'User')}</Text>
          </View>
        )}
      </View>
      <View style={styles.headerText}>
        <Text style={styles.name} numberOfLines={1}>{name ?? 'Loading…'}</Text>
        <Text style={styles.subtitle}>Potential roommate • Gida</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignColors.borderSoft,
    backgroundColor: DesignColors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
  },
  avatarInitials: {
    fontSize: 16,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  name: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  subtitle: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
