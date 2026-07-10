import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function AuthLegalFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        By continuing, you agree to our{' '}
        <Text accessibilityRole="link" style={styles.link}>
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text accessibilityRole="link" style={styles.link}>
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignSpacing.sm,
  },
  text: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.6,
    paddingHorizontal: DesignSpacing.lg,
  },
  link: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
});
