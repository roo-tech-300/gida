import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { SearchBar } from '@/components/ui/search-bar';
import { DesignColors, fontFamily } from '@/constants/design';
import { useAdminLodgeReservations } from '@/hooks/use-admin-lodge-reservations';
import { useRealtimeLodgeAlerts } from '@/hooks/use-lodge-realtime';
import type { AdminLodgeView, AdminLodgeReservation } from '@/services/admin-lodge-verification-service';

const VIEWS: { key: AdminLodgeView; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function LodgeReservationQueueScreen() {
  const router = useRouter();
  const [view, setView] = useState<AdminLodgeView>('pending');
  const [query, setQuery] = useState('');
  const { data: reservations = [], isLoading, isError, isRefetching, refetch } = useAdminLodgeReservations(view);
  const { unread, clearUnread } = useRealtimeLodgeAlerts();

  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  const filtered = reservations.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.listingTitle.toLowerCase().includes(q) ||
      r.listingLocation.toLowerCase().includes(q) ||
      r.members.some((m) => (m.userName ?? '').toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={DesignColors.primary} />}
      >
        <View style={styles.headerRow}>
          <BackButton hasBackground />
          <Text style={styles.title}>Applications</Text>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>

        <SearchBar value={query} onChangeText={setQuery} placeholder="Search pods..." />

        <View style={styles.pillsRow}>
          {VIEWS.map(({ key, label }) => {
            const active = view === key;
            return (
              <Pressable key={key} style={[styles.pill, active && styles.pillActive]} onPress={() => setView(key)}>
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={DesignColors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={32} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.stateText}>Could not load applications.</Text>
            <Pressable style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons
              name={view === 'rejected' ? 'close-circle-outline' : 'bed-outline'}
              size={32}
              color={DesignColors.onSurfaceVariant}
            />
            <Text style={styles.stateText}>
              {query.trim()
                ? 'No applications match your search.'
                : view === 'rejected'
                  ? 'No rejected applications.'
                  : 'No pending applications.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((reservation) => (
              <PodCard
                key={reservation.podId}
                reservation={reservation}
                onPress={() => router.push(`/admin/lodge-reservation/${reservation.podId}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PodCard({ reservation, onPress }: { reservation: AdminLodgeReservation; onPress: () => void }) {
  const memberNames = reservation.members
    .map((m) => m.userName ?? 'Unknown')
    .join(', ');
  const occupancyLabel = `${reservation.memberCount} of ${reservation.targetOccupancy}`;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardThumb}>
        {reservation.listingImage ? (
          <Image source={{ uri: reservation.listingImage }} style={styles.cardThumbImage} />
        ) : (
          <Ionicons name="home-outline" size={20} color={DesignColors.primary} />
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {reservation.listingTitle}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {reservation.listingLocation} · {formatDate(reservation.createdAt)}
        </Text>
        <Text style={styles.cardOccupancy} numberOfLines={1}>
          {occupancyLabel} members
        </Text>
        {memberNames ? (
          <Text style={styles.cardMembers} numberOfLines={1}>
            {memberNames}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.3 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
  },
  unreadText: { fontSize: 12, fontWeight: '700', color: DesignColors.onPrimary, fontFamily },
  pillsRow: { flexDirection: 'row', gap: 12 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  pillActive: { backgroundColor: DesignColors.primaryContainer, borderColor: DesignColors.primaryContainer },
  pillText: { fontSize: 14, color: DesignColors.onSurfaceVariant, fontFamily },
  pillTextActive: { color: DesignColors.onSurface, fontWeight: '600' },
  centerState: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 80 },
  stateText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: DesignColors.primaryContainer },
  retryText: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  list: { gap: 24 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 12, padding: 16 },
  cardThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardThumbImage: { width: '100%', height: '100%' },
  cardInfo: { flex: 1, gap: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  cardMeta: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily, marginBottom: 2 },
  cardOccupancy: { fontSize: 12, fontWeight: '600', color: DesignColors.primary, fontFamily, marginBottom: 2 },
  cardMembers: { fontSize: 11, color: DesignColors.onSurfaceVariant, fontFamily },
});
