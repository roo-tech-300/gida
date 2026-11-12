import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export interface MyHomeLink {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  href: Href;
}

/** Quiet shortcuts under the status card: household, tours, invite code. */
export function MyHomeLinks({ links }: { links: MyHomeLink[] }) {
  const router = useRouter();
  if (links.length === 0) return null;

  return (
    <View style={styles.list}>
      {links.map((link) => (
        <Pressable
          key={link.key}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => router.push(link.href)}
          accessibilityRole="button"
          testID={`my-home-link-${link.key}`}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={link.icon} size={20} color={DesignColors.primaryBright} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{link.title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{link.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: DesignSpacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, padding: DesignSpacing.md,
    borderRadius: DesignRadius.lg, backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1, borderColor: DesignColors.borderFaint,
  },
  rowPressed: { opacity: 0.75 },
  iconWrap: {
    width: 40, height: 40, borderRadius: DesignRadius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  copy: { flex: 1, gap: 2 },
  title: { ...DesignTypography.labelLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  subtitle: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
});
