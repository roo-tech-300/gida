import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { AdminRole } from '@/context/auth-context';

type Props = {
  role: AdminRole;
};

const ROLE_CONFIG: Record<AdminRole, { title: string; desc: string; route: string; icon: keyof typeof Ionicons.glyphMap }> = {
  super_admin: {
    title: 'Super Admin Dashboard',
    desc: 'Global access to manage all regions, admins, and inventory across the entire platform.',
    route: '/admin/super-dashboard',
    icon: 'globe-outline',
  },
  regional_admin: {
    title: 'Regional Admin Dashboard',
    desc: 'Manage your assigned region: listings, field admins, and regional performance.',
    route: '/admin/regional-dashboard',
    icon: 'business-outline',
  },
  field_admin: {
    title: 'Field Admin Dashboard',
    desc: 'Track property verifications, field reports, and your assigned zone tasks.',
    route: '/admin/field-dashboard',
    icon: 'location-outline',
  },
};

export function ActiveAdminCard({ role }: Props) {
  const config = ROLE_CONFIG[role];
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name={config.icon} size={28} color={DesignColors.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.desc}>{config.desc}</Text>
        </View>
      </View>
      <Pressable style={styles.button} onPress={() => router.push(config.route as any)}>
        <Text style={styles.buttonText}>Open Dashboard</Text>
        <Ionicons name="arrow-forward" size={18} color={DesignColors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: DesignSpacing.lg, paddingTop: DesignSpacing.sm },
  row: { flexDirection: 'row', gap: DesignSpacing.md },
  iconWrap: { width: 48, height: 48, borderRadius: DesignRadius.lg, backgroundColor: 'rgba(124, 58, 237, 0.1)', alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, gap: 4 },
  title: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  desc: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20 },
  button: {
    marginTop: DesignSpacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm,
    paddingVertical: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md,
    borderRadius: DesignRadius.lg, backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  buttonText: { ...DesignTypography.bodyMd, color: DesignColors.primary, fontFamily, fontWeight: '600' },
});
