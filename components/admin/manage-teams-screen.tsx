import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { MemberCard } from '@/components/admin/member-card';
import { ListScreen } from '@/components/ui/list-screen';
import { SearchBar } from '@/components/ui/search-bar';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, fontFamily } from '@/constants/design';
import { useAdminProfilesPaginated } from '@/hooks/use-admin-profiles-paginated';
import type { AdminMember } from '@/types/admin';

const TABS = ['All Members', 'Regional Admins', 'Field Admins'];

export function ManageTeamsScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const {
    data: adminProfiles,
    isLoading,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminProfilesPaginated();
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

  const hasFilters = query.trim().length > 0 || activeTab !== 'All Members';

  return (
    <ListScreen<AdminMember>
      title="Manage Teams"
      toolbar={
        <>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search teams..."
            hasFilter
            onFilterPress={() => setFiltersOpen((open) => !open)}
          />
          {filtersOpen ? (
            <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
              <View style={styles.pillsRow}>
                {TABS.map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <Pressable
                      key={tab}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setActiveTab(tab)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{tab}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          ) : null}
        </>
      }
      data={filtered}
      keyExtractor={(item) => item.id}
      isLoading={isLoading && members.length === 0}
      isError={isError}
      onRetry={() => void refetch()}
      errorMessage="Could not load the admin team."
      emptyMessage={hasFilters ? 'No members match your search.' : 'No members yet.'}
      emptyIcon={hasFilters ? 'search-outline' : 'people-outline'}
      isRefetching={isRefetching}
      onRefresh={() => void refetch()}
      onEndReached={() => void fetchNextPage()}
      isLoadingMore={isFetchingNextPage}
      contentContainerStyle={styles.content}
      action={{ icon: 'add', onPress: () => router.push('/admin/add-admin') }}
      renderItem={({ item }) => <MemberCard member={item} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  pillsRow: { flexDirection: 'row', gap: 12 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  pillActive: { backgroundColor: DesignColors.primaryContainer },
  pillText: { fontSize: 14, color: DesignColors.onSurfaceVariant, fontFamily },
  pillTextActive: { color: DesignColors.onSurface, fontWeight: '600' },
});
