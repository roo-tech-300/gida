import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { SearchBar } from '@/components/ui/search-bar';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, fontFamily } from '@/constants/design';
import { useAdminProfiles } from '@/hooks/use-admin-profiles';
import type { AdminMember, AdminRole } from '@/types/admin';

const TABS = ['All Members', 'Regional Admins', 'Field Admins'];

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  regional_admin: 'Regional Admin',
  field_admin: 'Field Admin',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ManageTeamsScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data = [], isLoading, isError, isRefetching, refetch } = useAdminProfiles();
  const [activeTab, setActiveTab] = useState('All Members');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (isError) {
      showToast({ message: 'Failed to load admin team. Pull down to retry.', type: 'error' });
    }
  }, [isError, showToast]);

  let filtered = data;
  if (activeTab === 'Regional Admins') filtered = filtered.filter((m) => m.role === 'regional_admin');
  if (activeTab === 'Field Admins') filtered = filtered.filter((m) => m.role === 'field_admin');
  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (m) => m.full_name.toLowerCase().includes(q) || (m.email?.toLowerCase().includes(q) ?? false),
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={DesignColors.primary} />}
        >
          <View style={styles.headerRow}>
            <BackButton hasBackground />
            <Text style={styles.title}>Manage Teams</Text>
          </View>

          <SearchBar value={query} onChangeText={setQuery} placeholder="Search teams..." hasFilter onFilterPress={() => setFiltersOpen((o) => !o)} />

          {filtersOpen && (
            <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
              <View style={styles.pillsRow}>
                {TABS.map((t) => {
                  const active = activeTab === t;
                  return (
                    <Pressable
                      key={t}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setActiveTab(t)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={DesignColors.primary} />
            </View>
          ) : isError ? (
            <View style={styles.centerState}>
              <Ionicons name="cloud-offline-outline" size={32} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.stateText}>Could not load the admin team.</Text>
              <Pressable style={styles.retryBtn} onPress={() => refetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="people-outline" size={32} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.stateText}>No members match your search.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filtered.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Pressable style={styles.fab} onPress={() => router.push('/admin/add-admin')}>
        <Ionicons name="add" size={28} color={DesignColors.onSurface} />
      </Pressable>
    </SafeAreaView>
  );
}

function MemberCard({ member }: { member: AdminMember }) {
  const isSuper = member.role === 'super_admin';
  const regionLine = isSuper ? 'Global Access' : member.region_name ?? 'No region assigned';
  const supervisorLine = isSuper ? 'Global Access' : member.supervisor_name ? `Reports to ${member.supervisor_name}` : 'Independent';

  return (
    <Pressable style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        {member.avatar_url ? (
          <Image source={{ uri: member.avatar_url }} style={styles.memberAvatarImage} contentFit="cover" />
        ) : (
          <Text style={[styles.memberAvatarText, { color: DesignColors.primary }]}>
            {getInitials(member.full_name)}
          </Text>
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.full_name}</Text>
        <Text style={styles.memberEmail}>{member.email ?? 'No email'}</Text>
        <Text style={styles.memberRole}>
          {ROLE_LABELS[member.role]} • {regionLine}
        </Text>
        <Text style={styles.memberJurisdiction}>{supervisorLine}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  kav: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.3 },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: DesignColors.surfaceContainerLowest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  pillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  pillActive: {
    backgroundColor: DesignColors.primaryContainer,
  },
  pillText: {
    fontSize: 14, color: DesignColors.onSurfaceVariant, fontFamily,
  },
  pillTextActive: {
    color: DesignColors.onSurface, fontWeight: '600',
  },

  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 80,
  },
  stateText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999,
    backgroundColor: DesignColors.primaryContainer,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },

  list: { gap: 24 },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 12, padding: 16,
  },
  memberAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  memberAvatarImage: { width: '100%', height: '100%' },
  memberAvatarText: { fontSize: 18, fontWeight: '700', fontFamily },
  memberInfo: { flex: 1, gap: 1 },
  memberName: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  memberEmail: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily, marginBottom: 2 },
  memberRole: { fontSize: 12, fontWeight: '600', color: DesignColors.primary, fontFamily, marginBottom: 2 },
  memberJurisdiction: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
});
