import { StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, fontFamily } from '@/constants/design';

type Props = {
  initials: string;
  name: string;
  roleLabel: string;
  subtitle: string;
};

export function AdminHeader({ initials, name, roleLabel, subtitle }: Props) {
  return (
    <View style={styles.headerSection}>
      <View style={styles.profileRow}>
        <BackButton hasBackground />
        <View style={styles.profileRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.profileName}>{name}</Text>
          <View style={styles.roleRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
            <Text style={styles.globalLabel}>{subtitle}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {},
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileRing: {
    padding: 2, borderRadius: 9999, backgroundColor: 'transparent',
    borderWidth: 2, borderColor: DesignColors.primaryContainer,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: DesignColors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800', color: DesignColors.onSurface, fontFamily },
  profileText: { gap: 4 },
  profileName: { fontSize: 22, fontWeight: '700', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.24 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999,
    backgroundColor: 'rgba(195, 192, 255, 0.1)',
    borderWidth: 1, borderColor: 'rgba(195, 192, 255, 0.2)',
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: DesignColors.primary, fontFamily, letterSpacing: 0.8, textTransform: 'uppercase' },
  globalLabel: { fontSize: 11, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 0.5 },
});
