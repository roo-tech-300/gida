import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

import { BackButton } from '@/components/ui/back-button';
import { ListState } from '@/components/ui/list-state';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useAdminLodgeReservations } from '@/hooks/use-admin-lodge-reservations';
import { useAdminTours, useCompleteTour } from '@/hooks/use-admin-tours';
import { useDecideApplication } from '@/hooks/use-decide-application';
import type { AdminLodgeReservation } from '@/services/admin-lodge-verification-service';
import { ADMIN_MANAGE_ROUTE, ADMIN_ROLE_LABEL } from '@/utils/admin-routes';

import { ApplicationRow } from './application-row';
import { DeclineSheet } from './decline-sheet';
import { TourTodayRow } from './tour-today-row';
import { MyHomeLinks } from '@/components/my-home/my-home-links';

function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AdminTodayScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useAppToast();
  const apps = useAdminLodgeReservations('pending');
  const tours = useAdminTours('active');
  const completeTour = useCompleteTour();
  const { approve, decline, busyPodId } = useDecideApplication();
  const [now, setNow] = useState(() => Date.now());
  const [declining, setDeclining] = useState<AdminLodgeReservation | null>(null);
  const [tourBusyId, setTourBusyId] = useState<string | null>(null);

  // Depend on the stable refetch functions, never on the query objects (new every render).
  const { refetch: refetchApps } = apps;
  const { refetch: refetchTours } = tours;
  const refresh = useCallback(() => { setNow(Date.now()); void refetchApps(); void refetchTours(); }, [refetchApps, refetchTours]);
  useFocusEffect(useCallback(() => { setNow(Date.now()); void refetchApps(); }, [refetchApps]));

  const pending = useMemo(() => [...(apps.data ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [apps.data]);
  const today = todayKey();
  const todayTours = useMemo(() => (tours.data ?? []).filter((t) => t.scheduled_date === today && t.status === 'booked'), [tours.data, today]);

  const markDone = useCallback(async (id: string) => {
    setTourBusyId(id);
    try {
      const ok = await completeTour.mutateAsync(id);
      showToast({ message: ok ? 'Tour marked done.' : 'Could not update this tour. Please try again.', type: ok ? 'success' : 'error' });
    } catch (error) {
      console.error('[AdminToday] Failed to complete tour:', error);
      showToast({ message: 'Could not update this tour. Please try again.', type: 'error' });
    } finally {
      setTourBusyId(null);
    }
  }, [completeTour, showToast]);

  const submitDecline = useCallback(async (reason: string) => {
    if (!declining) return;
    const ok = await decline(declining, reason);
    if (ok) setDeclining(null);
  }, [declining, decline]);

  const role = profile?.admin_role;
  const manageLinks = role ? [{ key: 'manage', icon: 'settings-outline' as const, title: 'Manage', subtitle: 'Listings, landlords, regions and team', href: ADMIN_MANAGE_ROUTE[role] as Href }] : [];
  const dateLabel = new Date(now).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={apps.isRefetching || tours.isRefetching} onRefresh={refresh} tintColor={DesignColors.primaryBright} colors={[DesignColors.primaryBright]} />}
      >
        <View style={styles.pad}>
          <BackButton />
          <Text style={styles.title}>Today</Text>
          <Text style={styles.sub}>{dateLabel}{profile?.full_name ? ` · ${profile.full_name}` : ''}{role ? `, ${ADMIN_ROLE_LABEL[role]}` : ''}</Text>
        </View>

        <View style={[styles.stats, styles.pad]}>
          <Stat value={pending.length} label="to decide" highlight />
          <Stat value={todayTours.length} label="tours today" />
        </View>

        <Text style={[styles.section, styles.pad]}>NEEDS A DECISION · OLDEST FIRST</Text>
        <View style={[styles.stack, styles.pad]}>
          {apps.isLoading ? <ListState kind="loading" message="Loading applications…" /> : null}
          {apps.isError ? <ListState kind="error" message="Could not load applications." onRetry={() => { void apps.refetch(); }} /> : null}
          {!apps.isLoading && !apps.isError && pending.length === 0 ? <ListState kind="empty" icon="checkmark-done-outline" message="You are all caught up. Nothing is waiting for a decision." /> : null}
          {pending.map((application) => (
            <ApplicationRow
              key={application.podId}
              application={application}
              now={now}
              busy={busyPodId === application.podId}
              onDetails={() => router.push(`/admin/lodge-reservation/${application.podId}`)}
              onApprove={() => { void approve(application); }}
              onDecline={() => setDeclining(application)}
            />
          ))}
        </View>

        <Text style={[styles.section, styles.pad]}>TOURS TODAY</Text>
        <View style={[styles.stack, styles.pad]}>
          {tours.isError ? <ListState kind="error" message="Could not load tours." onRetry={() => { void tours.refetch(); }} /> : null}
          {!tours.isLoading && !tours.isError && todayTours.length === 0 ? <Text style={styles.empty}>No tours booked for today.</Text> : null}
          {todayTours.map((tour) => (
            <TourTodayRow key={tour.id} tour={tour} busy={tourBusyId === tour.id} onOpen={() => router.push(`/admin/tour/${tour.id}`)} onDone={() => { void markDone(tour.id); }} />
          ))}
        </View>

        <View style={styles.pad}><MyHomeLinks links={manageLinks} /></View>
      </ScrollView>

      <DeclineSheet
        key={declining?.podId ?? 'closed'}
        visible={declining !== null}
        applicantLabel={declining?.members[0]?.userName ?? 'this request'}
        placeLabel={declining?.listingTitle ?? ''}
        submitting={declining !== null && busyPodId === declining.podId}
        onSubmit={(reason) => { void submitDecline(reason); }}
        onClose={() => setDeclining(null)}
      />
    </SafeAreaView>
  );
}

function Stat({ value, label, highlight = false }: { value: number; label: string; highlight?: boolean }) {
  return (
    <View style={styles.stat} testID={`stat-${label.replace(/\s/g, '-')}`}>
      <Text style={[styles.statValue, highlight && styles.statHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  content: { paddingVertical: DesignSpacing.md, paddingBottom: DesignSpacing.xl, gap: DesignSpacing.lg },
  pad: { marginHorizontal: DesignSpacing.marginMobile },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.6, marginTop: DesignSpacing.sm },
  sub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  stats: { flexDirection: 'row', gap: DesignSpacing.sm },
  stat: { flex: 1, padding: DesignSpacing.md, borderRadius: 16, gap: 2, backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderSoft },
  statValue: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: DesignColors.onSurface, fontFamily },
  statHighlight: { color: DesignColors.primaryFixed },
  statLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  section: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  stack: { gap: DesignSpacing.sm },
  empty: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
});
