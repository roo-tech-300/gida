import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';

import { AuthButton } from '@/components/auth/auth-button';
import { PendingLodgeInvites } from '@/components/profile/pending-lodge-invite-card';
import { ReservedHousesSection } from '@/components/profile/reserved-houses-section';
import { useExpiredLodges } from '@/components/profile/use-expired-lodges';
import { ListState } from '@/components/ui/list-state';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useUserSlotCredits } from '@/hooks/use-liquidity';
import { isEndedStage, pickPrimaryReservation, progressSteps, reservationStage } from '@/utils/reservation-state';

import { MyHomeHero } from './my-home-hero';
import { MyHomeLinks, type MyHomeLink } from './my-home-links';
import { MyHomeNextStep } from './my-home-next-step';
import { MyHomeStepper } from './my-home-stepper';

export function MyHomeScreen() {
  const router = useRouter();
  const { data: credits, isPending, isError, isRefetching, refetch } = useUserSlotCredits();
  const [now] = useState(() => Date.now());

  const expiredLodges = useExpiredLodges(credits, now);
  // A live reservation comes first; a hold that lapsed in the last 48h gets its own card
  // so the student sees what happened and can reserve again.
  const primary = useMemo(() => pickPrimaryReservation(credits) ?? expiredLodges[0] ?? null, [credits, expiredLodges]);
  const others = useMemo(() => (credits ?? []).filter((c) => c.id !== primary?.id), [credits, primary]);

  const links = useMemo<MyHomeLink[]>(() => {
    const list: MyHomeLink[] = [];
    const stage = primary ? reservationStage(primary) : null;
    if (primary && primary.target_occupancy > 1 && (stage === 'awaiting_payment' || stage === 'paid')) {
      list.push({ key: 'household', icon: 'people-outline', title: 'Your household', subtitle: 'See who is in and who has paid', href: { pathname: '/property/lobby', params: { creditId: primary.id } } });
    }
    list.push({ key: 'tours', icon: 'calendar-outline', title: 'My tours', subtitle: 'Visits you have booked', href: '/property/tour-history' as Href });
    list.push({ key: 'code', icon: 'link-outline', title: 'Have an invite code?', subtitle: 'Join a friend’s household', href: '/property/join-with-code' as Href });
    return list;
  }, [primary]);

  const stage = primary ? reservationStage(primary) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} tintColor={DesignColors.primaryBright} colors={[DesignColors.primaryBright]} />}
      >
        <View style={[styles.header, styles.pad]}>
          <Text style={styles.title}>My Home</Text>
          <Text style={styles.subtitle}>Everything about your next place, in one spot.</Text>
        </View>

        {isPending ? <ListState kind="loading" message="Loading your home…" /> : null}
        {isError ? <ListState kind="error" message="We could not load your reservations. Pull down or try again." onRetry={() => { void refetch(); }} /> : null}

        {primary && stage ? (
          <View style={[styles.stack, styles.pad]}>
            <MyHomeHero credit={primary} onPress={() => router.push(`/property/${primary.listing_id ?? ''}` as Href)} />
            {!isEndedStage(stage) ? <MyHomeStepper steps={progressSteps(stage)} /> : null}
            <MyHomeNextStep credit={primary} stage={stage} />
          </View>
        ) : null}

        {!isPending && !isError && !primary ? (
          <View style={[styles.empty, styles.pad]} testID="my-home-empty">
            <ListState kind="empty" icon="home-outline" message="No place reserved yet. Find somewhere you love and hold your spot." />
            <AuthButton label="Find a place" onPress={() => router.replace('/(tabs)')} />
          </View>
        ) : null}

        <PendingLodgeInvites />
        <View style={styles.pad}><MyHomeLinks links={links} /></View>
        {others.length > 0 ? <ReservedHousesSection reservations={others} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  content: { paddingVertical: DesignSpacing.md, paddingBottom: DesignSpacing.xl, gap: DesignSpacing.lg },
  pad: { marginHorizontal: DesignSpacing.marginMobile },
  header: { gap: 4, paddingTop: DesignSpacing.sm },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: DesignColors.onSurface, fontFamily },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  stack: { gap: DesignSpacing.lg },
  empty: { gap: DesignSpacing.md },
});
