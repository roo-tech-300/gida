import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BackButton } from '@/components/ui/back-button';
import { SearchBar } from '@/components/ui/search-bar';
import { DesignColors, fontFamily } from '@/constants/design';
import { ADMIN_MEMBERS, type AdminMember } from '@/dummy/admin-mock';

const TABS = ['All Members', 'Regional Admins', 'Field Admins'];

export function ManageTeamsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All Members');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  let filtered = ADMIN_MEMBERS;
  if (activeTab === 'Regional Admins') filtered = filtered.filter((m) => m.role === 'regional_admin');
  if (activeTab === 'Field Admins') filtered = filtered.filter((m) => m.role === 'field_admin');
  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter((m) => m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <View style={styles.list}>
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/admin/add-admin')}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>
    </SafeAreaView>
  );
}

function MemberCard({ member }: { member: AdminMember }) {
  const isRegional = member.role === 'regional_admin';
  return (
    <Pressable style={styles.memberCard}>
      <View style={[styles.memberAvatar, { backgroundColor: 'rgba(195,192,255,0.1)' }]}>
        <Text style={[styles.memberAvatarText, { color: DesignColors.primary }]}>{member.avatar_initials}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.full_name}</Text>
        <Text style={styles.memberEmail}>
          {member.email} • {isRegional ? 'Regional Admin' : 'Field Admin'}
        </Text>
        <Text style={styles.memberJurisdiction}>
          {isRegional ? 'Jurisdiction' : 'Allocation Queue'}: {member.jurisdiction}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: '#ffffff', fontFamily, letterSpacing: -0.3 },
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
    shadowColor: '#000000',
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
    backgroundColor: 'rgba(26, 26, 30, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillActive: {
    backgroundColor: DesignColors.primaryContainer,
  },
  pillText: {
    fontSize: 14, color: DesignColors.onSurfaceVariant, fontFamily,
  },
  pillTextActive: {
    color: '#ffffff', fontWeight: '600',
  },
  list: { gap: 24 },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 12, padding: 16,
  },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: 18, fontWeight: '700', fontFamily },
  memberInfo: { flex: 1, gap: 1 },
  memberName: { fontSize: 16, fontWeight: '700', color: '#ffffff', fontFamily },
  memberEmail: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily, marginBottom: 2 },
  memberJurisdiction: { fontSize: 12, fontWeight: '600', color: DesignColors.primary, fontFamily },
});
