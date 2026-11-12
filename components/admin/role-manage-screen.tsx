import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';

import { AdminHeader } from '@/components/admin/admin-header';
import { ManageToolGrid, type ManageTool } from '@/components/admin/manage-tool-grid';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth, type AdminRole } from '@/context/auth-context';
import { useRealtimeLodgeAlerts } from '@/hooks/use-lodge-realtime';
import { useRealtimeTourAlerts } from '@/hooks/use-tour-realtime';
import { ADMIN_ROLE_LABEL } from '@/utils/admin-routes';
import { getInitials } from '@/utils/initials';

type ToolDef = { key: string; title: string; icon: ManageTool['icon']; href: Href };

const SHARED: ToolDef[] = [
  { key: 'listing', title: 'Add a listing', icon: 'add-circle-outline', href: '/admin/create-listing' },
  { key: 'inventory', title: 'All listings', icon: 'storefront-outline', href: '/admin/total-inventory' },
  { key: 'landlords', title: 'Landlords', icon: 'people-outline', href: '/admin/landlord-contracts' },
];

// Only destinations that exist. Regions and teams are for the roles that run them.
const BY_ROLE: Record<AdminRole, ToolDef[]> = {
  field_admin: SHARED,
  regional_admin: [...SHARED, { key: 'teams', title: 'My team', icon: 'git-network-outline', href: '/admin/manage-teams' }],
  super_admin: [...SHARED, { key: 'teams', title: 'Teams', icon: 'git-network-outline', href: '/admin/manage-teams' }, { key: 'regions', title: 'Regions', icon: 'globe-outline', href: '/admin/regions' }],
};

const SUBTITLE: Record<AdminRole, string> = {
  field_admin: 'Your listings and landlords',
  regional_admin: 'Your region',
  super_admin: 'All regions',
};

/** Setup and management for one admin role. Daily approvals and tours live on Today. */
export function RoleManageScreen({ role }: { role: AdminRole }) {
  const { profile } = useAuth();
  const { unread: tourUnread, clearUnread: clearTours } = useRealtimeTourAlerts();
  const { unread: lodgeUnread, clearUnread: clearLodge } = useRealtimeLodgeAlerts();

  const tools = useMemo<ManageTool[]>(() => {
    const queue: ManageTool[] = [
      { key: 'applications', title: 'Applications', icon: 'document-text-outline', badge: lodgeUnread, onPress: () => { clearLodge(); router.push('/admin/lodge-reservations'); } },
      { key: 'tours', title: 'Tour requests', icon: 'calendar-outline', badge: tourUnread, onPress: () => { clearTours(); router.push('/admin/tours'); } },
    ];
    const setup = BY_ROLE[role].map((def) => ({ key: def.key, title: def.title, icon: def.icon, onPress: () => router.push(def.href) }));
    return [...queue, ...setup];
  }, [role, lodgeUnread, tourUnread, clearLodge, clearTours]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AdminHeader initials={getInitials(profile?.full_name)} name={profile?.full_name ?? ADMIN_ROLE_LABEL[role]} roleLabel={ADMIN_ROLE_LABEL[role]} subtitle={SUBTITLE[role]} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MANAGE</Text>
          <ManageToolGrid tools={tools} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  content: { padding: DesignSpacing.marginMobile, gap: DesignSpacing.xl },
  section: { gap: DesignSpacing.md },
  sectionTitle: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
});
