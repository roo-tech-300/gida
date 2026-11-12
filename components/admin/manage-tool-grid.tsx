import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export interface ManageTool {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Unread count shown as a small badge. */
  badge?: number;
  onPress: () => void;
}

/** A grid of real tools only. Every tile goes somewhere. */
export function ManageToolGrid({ tools }: { tools: ManageTool[] }) {
  return (
    <View style={styles.grid}>
      {tools.map((tool) => (
        <Pressable key={tool.key} style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={tool.onPress} accessibilityRole="button" testID={`manage-tool-${tool.key}`}>
          {tool.badge && tool.badge > 0 ? (
            <View style={styles.badge}><Text style={styles.badgeText}>{tool.badge > 9 ? '9+' : tool.badge}</Text></View>
          ) : null}
          <View style={styles.iconWrap}>
            <Ionicons name={tool.icon} size={22} color={DesignColors.primaryBright} />
          </View>
          <Text style={styles.title}>{tool.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: DesignSpacing.sm },
  card: {
    width: '48.5%', minHeight: 104, padding: DesignSpacing.md, gap: DesignSpacing.md, justifyContent: 'space-between',
    borderRadius: DesignRadius.xl, backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  pressed: { opacity: 0.8 },
  iconWrap: { width: 40, height: 40, borderRadius: DesignRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primaryTint },
  title: { ...DesignTypography.labelLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  badge: {
    position: 'absolute', top: 10, right: 10, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: DesignColors.onPrimary, fontFamily },
});
