import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function RoommateProfileAbout({ bio }: { bio: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>About</Text>
      <Text style={styles.bio}>{bio}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.lg,
    gap: DesignSpacing.sm,
  },
  title: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  bio: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    lineHeight: 26,
  },
});
