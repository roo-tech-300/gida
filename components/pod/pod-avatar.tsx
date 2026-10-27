import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';

export const AVATAR_COLORS = [
  DesignColors.primaryContainer,
  '#E8D5F5',
  '#D5EEF5',
  '#F5E6D5',
  '#D5F5E6',
  '#F5D5E0',
] as const;

export function getInitials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name ?? '').slice(0, 2).toUpperCase() || '??';
}

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name ?? '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

type Props = {
  name: string;
  avatarUrl?: string | null;
  size: number;
};

/** Single circular avatar with an initials fallback. */
export function PodAvatar({ name, avatarUrl, size }: Props) {
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={[styles.image, shape]} contentFit="cover" />;
  }

  return (
    <View style={[styles.fallback, shape, { backgroundColor: getAvatarColor(name) }]}>
      <Text style={[styles.initials, { fontSize: Math.max(9, Math.round(size * 0.36)) }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
    color: DesignColors.onPrimaryContainer,
    fontFamily,
  },
});
