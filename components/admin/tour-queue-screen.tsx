import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { SearchBar } from '@/components/ui/search-bar';
import { DesignColors, fontFamily } from '@/constants/design';
import { useAdminTours } from '@/hooks/use-admin-tours';
import { useRealtimeTourAlerts } from '@/hooks/use-tour-realtime';
import { formatTourDate } from '@/utils/tour-availability';
import type { AdminTourView } from '@/services/admin-tour-service';
import type { AdminTour } from '@/types/tour-booking';

const VIEWS: { key: AdminTourView; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export function TourQueueScreen() {
  const router = useRouter();
  const [view, setView] = useState<AdminTourView>('active');
  const [query, setQuery] = useState('');
  const { data: tours = [], isLoading, isError, isRefetching, refetch } = useAdminTours(view);
  const { unread, clearUnread } = useRealtimeTourAlerts();

  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  const filtered = tours.filter((tour) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (tour.listings?.title ?? '').toLowerCase().includes(q) ||
      (tour.listings?.location_landmark ?? '').toLowerCase().includes(q) ||
      (tour.student_name ?? '').toLowerCase().includes(q)
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
          <Text style={styles.title}>Tour Requests</Text>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>

        <SearchBar value={query} onChangeText={setQuery} placeholder="Search tours..." />

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
            <Text style={styles.stateText}>Could not load tours.</Text>
            <Pressable style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons
              name={view === 'completed' ? 'checkmark-done-outline' : 'calendar-outline'}
              size={32}
              color={DesignColors.onSurfaceVariant}
            />
            <Text style={styles.stateText}>
              {query.trim()
                ? 'No tours match your search.'
                : view === 'completed'
                  ? 'No completed tours yet.'
                  : 'No tours yet.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((tour) => (
              <TourCard key={tour.id} tour={tour} onPress={() => router.push(`/admin/tour/${tour.id}`)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TourCard({ tour, onPress }: { tour: AdminTour; onPress: () => void }) {
  return (
    <Pressable style={styles.tourCard} onPress={onPress}>
      <View style={styles.tourThumb}>
        {tour.listings?.primary_image ? (
          <Image source={{ uri: tour.listings.primary_image }} style={styles.tourThumbImage} />
        ) : (
          <Ionicons name="home-outline" size={20} color={DesignColors.primary} />
        )}
      </View>
      <View style={styles.tourInfo}>
        <Text style={styles.tourTitle} numberOfLines={1}>
          {tour.listings?.title ?? 'Unnamed property'}
        </Text>
        <Text style={styles.tourMeta} numberOfLines={1}>
          {tour.listings?.location_landmark ?? 'Gida property'} · {formatTourDate(tour.scheduled_date)}
        </Text>
        <Text style={styles.tourSchedule} numberOfLines={1}>
          {tour.scheduled_time} · {tour.student_name ?? 'Resident'}
        </Text>
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
  tourCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 12, padding: 16 },
  tourThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tourThumbImage: { width: '100%', height: '100%' },
  tourInfo: { flex: 1, gap: 1 },
  tourTitle: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  tourMeta: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily, marginBottom: 2 },
  tourSchedule: { fontSize: 12, fontWeight: '600', color: DesignColors.primary, fontFamily, marginBottom: 2 },
});
