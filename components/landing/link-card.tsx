import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type LinkCardProps = PressableProps & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
};

/**
 * A single "link in bio" style row — used for the coming-soon screen's
 * link-tree of places to follow Gida while the app isn't live yet.
 */
export function LinkCard({ icon, label, sublabel, style, ...props }: LinkCardProps) {
  return (
    <Pressable
      accessibilityRole="link"
      style={({ pressed, hovered }) => [
        styles.card,
        (pressed || hovered) && styles.cardPressed,
        typeof style === 'function' ? style({ pressed, hovered }) : style,
      ]}
      {...props}>
      <View style={styles.iconBadge}>
        <Ionicons name={icon} size={20} color={DesignColors.onPrimary} />
      </View>
      <View style={styles.textGroup}>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={DesignColors.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    width: '100%',
    minHeight: 64,
    paddingHorizontal: DesignSpacing.md,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
  },
  cardPressed: {
    transform: [{ scale: 1.02 }],
    borderColor: DesignColors.primaryTintBorder,
    backgroundColor: DesignColors.primaryTint,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...DesignTypography.labelLg,
    color: DesignColors.textPrimary,
    fontFamily,
  },
  sublabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
