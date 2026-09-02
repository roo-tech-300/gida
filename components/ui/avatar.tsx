import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';
import { getInitials } from '@/utils/initials';

type AvatarProps = {
  imageUrl?: string | null;
  name?: string | null;
  size?: number;
  roundness?: 'circle' | number;
};

export function Avatar({ imageUrl, name, size = 40, roundness = 'circle' }: AvatarProps) {
  const wrapperStyles = {
    width: size,
    height: size,
    borderRadius: roundness === 'circle' ? size / 2 : roundness,
  };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={wrapperStyles} contentFit="cover" transition={150} />;
  }

  const initials = getInitials(name);
  const initialFontSize = Math.max(11, Math.round(size * 0.38));

  return (
    <View style={[styles.fallback, wrapperStyles]}>
      <Text style={[styles.initial, { fontSize: initialFontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
