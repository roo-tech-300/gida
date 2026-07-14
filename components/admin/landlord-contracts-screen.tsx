import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, fontFamily } from '@/constants/design';
import { useLandlords } from '@/hooks/use-landlords';

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function LandlordContractsScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { data: landlords, isPending, refetch, isRefetching } = useLandlords();

  const filtered = useMemo(() => {
    if (!landlords) return [];
    if (!query.trim()) return landlords;
    const q = query.toLowerCase();
    return landlords.filter(
      (l) => l.full_name.toLowerCase().includes(q) || (l.email ?? '').toLowerCase().includes(q),
    );
  }, [query, landlords]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <BackButton hasBackground />
          <Text style={styles.headerTitle}>Landlord Contracts</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={DesignColors.primary} />}
        >
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} style={{ opacity: 0.5 }} />
            <TextInput
              placeholder="Search landlord..."
              placeholderTextColor={DesignColors.onSurfaceVariant}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricTop}>
                <Text style={styles.metricValue}>{landlords?.length ?? 0}</Text>
              </View>
              <Text style={styles.metricLabel}>Total Landlords</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricTop}>
                <Text style={styles.metricValue}>
                  {landlords ? landlords.reduce((s, l) => s + l.listings.count, 0) : 0}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Active Leases</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Registered Landlords</Text>

          {isPending ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={DesignColors.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.emptyText}>{query ? 'No landlords match your search' : 'No landlords yet'}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filtered.map((landlord) => (
                <Pressable key={landlord.id} style={styles.landlordCard} onPress={() => router.push(`/admin/landlord-properties/${landlord.id}` as any)}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(landlord.full_name)}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.landlordName}>{landlord.full_name}</Text>
                      <Text style={styles.landlordEmail}>{landlord.email ?? ''}</Text>
                      <Text style={styles.propertyText}>{landlord.listings.count} Properties</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={DesignColors.onSurfaceVariant} style={{ opacity: 0.4 }} />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={() => router.push('/admin/create-landlord')}>
          <Ionicons name="add" size={24} color="#ffffff" />
          <Text style={styles.fabLabel}>Add Landlord</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 9999, paddingHorizontal: 16, height: 44,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily, paddingVertical: 0 },

  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricCard: {
    flex: 1, borderRadius: 16, padding: 16,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  metricTop: { flexDirection: 'row', alignItems: 'center' },
  metricValue: { fontSize: 22, fontWeight: '800', color: '#ffffff', fontFamily },
  metricLabel: { fontSize: 11, fontWeight: '700', color: DesignColors.primaryContainer, fontFamily, letterSpacing: 0.5 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily, marginBottom: 16 },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },

  list: { gap: 12 },
  landlordCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 14,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: DesignColors.primary, fontFamily },
  cardInfo: { flex: 1, gap: 2 },
  landlordName: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  landlordEmail: { fontSize: 11, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.7 },
  propertyText: { fontSize: 11, fontWeight: '600', color: DesignColors.onPrimaryContainer, fontFamily, opacity: 0.8, marginTop: 4 },

  fab: {
    position: 'absolute', left: 16, right: 16,
    height: 52, borderRadius: 26,
    backgroundColor: DesignColors.primaryContainer,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  fabLabel: { fontSize: 14, fontWeight: '700', color: '#ffffff', fontFamily },
});
