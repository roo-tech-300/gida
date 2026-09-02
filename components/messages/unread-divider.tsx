import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function UnreadDivider() {
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.label}>Unread messages</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: DesignSpacing.xs,
  },
  pill: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 4,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryContainer,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  label: {
    ...DesignTypography.labelSm,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
