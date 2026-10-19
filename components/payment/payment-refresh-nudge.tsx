import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function PaymentRefreshNudge() {
  return (
    <View style={styles.container}>
      <Ionicons name="refresh" size={20} color={DesignColors.primaryBright} />
      <Text style={styles.text}>Pull down to refresh to check your payment status</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryTint,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    padding: DesignSpacing.md,
    marginBottom: DesignSpacing.md,
  },
  text: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
