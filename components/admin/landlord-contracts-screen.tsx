import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { fontFamily } from '@/constants/design';
import { LANDLORDS } from '@/dummy/admin-mock';

const C = {
  primary: '#c3c0ff',
  primaryContainer: '#4f46e5',
  secondary: '#4edea3',
  tertiary: '#ffb695',
  onSurface: '#e5e1e4',
  onSurfaceVariant: '#c7c4d8',
  surface: '#131315',
};

export function LandlordContractsScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return LANDLORDS;
    const q = query.toLowerCase();
    return LANDLORDS.filter(
      (l) => l.full_name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <BackButton hasBackground />
          <Text style={styles.headerTitle}>Landlord Contracts</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={C.onSurfaceVariant} style={{ opacity: 0.5 }} />
            <TextInput
              placeholder="Search landlord..."
              placeholderTextColor={C.onSurfaceVariant}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricTop}>
                <Text style={styles.metricValue}>124</Text>
                <View style={styles.metricBadge}>
                  <Ionicons name="trending-up" size={12} color={C.secondary} />
                  <Text style={styles.metricBadgeText}>+12%</Text>
                </View>
              </View>
              <Text style={styles.metricLabel}>Active Leases</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricTop}>
                <Text style={styles.metricValue}>08</Text>
                <View style={[styles.metricBadge, styles.metricBadgeWarning]}>
                  <Ionicons name="alert-circle" size={12} color={C.tertiary} />
                </View>
              </View>
              <Text style={[styles.metricLabel, { color: C.tertiary }]}>Pending Review</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Registered Landlords</Text>
            <Pressable>
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>

          <View style={styles.list}>
            {filtered.map((landlord) => {
              const hasActive = landlord.active_leases > 0;
              const hasPending = landlord.pending_review > 0;
              return (
                <Pressable key={landlord.id} style={styles.landlordCard}>
                  <View style={styles.cardLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{landlord.initials}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.landlordName}>{landlord.full_name}</Text>
                      <Text style={styles.landlordEmail}>{landlord.email}</Text>
                      <View style={styles.propertyRow}>
                        <Ionicons name="business-outline" size={13} color={C.primary} />
                        <Text style={styles.propertyText}>{landlord.properties_onboarded} Properties Onboarded</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    {hasActive && (
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>{landlord.active_leases} Active</Text>
                      </View>
                    )}
                    {hasPending && (
                      <View style={[styles.statusPill, styles.statusPillPending]}>
                        <Text style={[styles.statusPillText, styles.statusPillTextPending]}>{landlord.pending_review} Pending</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={C.onSurfaceVariant} style={{ opacity: 0.4 }} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]}>
          <Ionicons name="add" size={24} color="#ffffff" />
          <Text style={styles.fabLabel}>Upload New Deed Contract</Text>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.onSurface, fontFamily },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 9999, paddingHorizontal: 16, height: 44,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: C.onSurface, fontFamily, paddingVertical: 0 },

  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricCard: {
    flex: 1, borderRadius: 16, padding: 16,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricValue: { fontSize: 22, fontWeight: '800', color: '#ffffff', fontFamily },
  metricBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(78,222,163,0.12)',
  },
  metricBadgeWarning: { backgroundColor: 'rgba(255,182,149,0.12)' },
  metricBadgeText: { fontSize: 11, fontWeight: '700', color: C.secondary, fontFamily },
  metricLabel: { fontSize: 11, fontWeight: '700', color: C.primary, fontFamily, letterSpacing: 0.5 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface, fontFamily },
  viewAll: { fontSize: 12, fontWeight: '600', color: C.primaryContainer, fontFamily, letterSpacing: 0.5 },

  list: { gap: 12 },
  landlordCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 14,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(195,192,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: C.primary, fontFamily },
  cardInfo: { flex: 1, gap: 2 },
  landlordName: { fontSize: 14, fontWeight: '700', color: C.onSurface, fontFamily },
  landlordEmail: { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant, fontFamily, opacity: 0.7 },
  propertyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  propertyText: { fontSize: 11, fontWeight: '600', color: C.primary, fontFamily, opacity: 0.8 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(78,222,163,0.12)',
  },
  statusPillPending: { backgroundColor: 'rgba(255,182,149,0.12)' },
  statusPillText: { fontSize: 11, fontWeight: '700', color: C.secondary, fontFamily },
  statusPillTextPending: { color: C.tertiary },

  fab: {
    position: 'absolute', left: 16, right: 16,
    height: 52, borderRadius: 26,
    backgroundColor: C.primaryContainer,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  fabLabel: { fontSize: 14, fontWeight: '700', color: '#ffffff', fontFamily },
});
