import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type AuthBrandHeaderProps = {
  size?: 'large' | 'compact';
};

export function AuthBrandHeader({ size = 'large' }: AuthBrandHeaderProps) {
  const isLarge = size === 'large';
  const logoSize = isLarge ? 120 : 64;

  return (
    <View style={[styles.container, isLarge ? styles.containerLarge : styles.containerCompact]}>
      <View style={styles.logoShield}>
        <Image
          accessibilityLabel="Gida logo"
          source={require('@/assets/images/logo.png')}
          style={{ width: logoSize, height: logoSize }}
          contentFit="contain"
        />
      </View>
      {isLarge ? (
        <>
          <Text style={[styles.name, styles.nameLarge]}>GIDA</Text>
          <Text style={styles.tagline}>Find verified off-k listings in Gidan Kwano and Bosso.</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerLarge: {
    gap: DesignSpacing.md,
  },
  containerCompact: {
    gap: DesignSpacing.sm,
    alignSelf: 'center',
    marginBottom: DesignSpacing.lg,
  },
  logoShield: {
    backgroundColor: DesignColors.surfaceContainerLowest,
    padding: DesignSpacing.sm,
    borderRadius: 24,
  },
  name: {
    color: DesignColors.textPrimary,
    fontFamily,
    fontWeight: '700',
    letterSpacing: -0.24,
  },
  nameLarge: {
    fontSize: 24,
    lineHeight: 32,
  },
  tagline: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    opacity: 0.7,
    paddingHorizontal: DesignSpacing.md,
  },
});
