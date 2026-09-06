import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { SearchBar } from '@/components/ui/search-bar';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, fontFamily } from '@/constants/design';
import { useAdminProfilesPaginated } from '@/hooks/use-admin-profiles-paginated';
import type { AdminMember } from '@/types/admin';
import { MemberCard } from '@/components/admin/member-card';
import { PaginatedFlatList } from '@/components/ui/paginated-flat-list';

const TABS = ['All Members', 'Regional Admins', 'Field Admins'];

export function ManageTeamsScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data: adminProfiles, isLoading, fetchNextPage } = useAdminProfilesPaginated();
  const [activeTab, setActiveTab] = useState('All Members');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isLoading) {
      showToast({ message: 'Loading admin team...', type: 'info' });
    }
  }, [isLoading, showToast]);

  const members = useMemo(
    () => (adminProfiles?.pages ?? []).reduce<AdminMember[]>((acc, page) => acc.concat(page), []),
    [adminProfiles],
  );

  const filtered = useMemo(() => {
    let list = members;
    if (activeTab === 'Regional Admins') list = list.filter((m) => m.role === 'regional_admin');
    if (activeTab === 'Field Admins') list = list.filter((m) => m.role === 'field_admin');
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) => m.full_name.toLowerCase().includes(q) || (m.email?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [activeTab, members, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SafeKeyboardView style={styles.kav}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchNextPage} tintColor={DesignColors.primary} />}
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

          {isLoading && members.length === 0 ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={DesignColors.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="people-outline" size={32} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.stateText}>No members match your search.</Text>
            </View>
          ) : (
            <PaginatedFlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <MemberCard member={item} />}
              onEndReached={fetchNextPage}
              onEndReachedThreshold={0.5}
            />
          )}
        </ScrollView>
      </SafeKeyboardView>

      <Pressable style={styles.fab} onPress={() => router.push('/admin/add-admin')}>
        <Ionicons name="add" size={28} color={DesignColors.onSurface} />
      </Pressable>
    </SafeAreaView>
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
});