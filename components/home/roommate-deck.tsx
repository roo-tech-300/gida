import { useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RoommateDeckCard } from '@/components/home/roommate-deck-card';
import { NoResultsFoundScreen } from '@/components/ui/no-results-found-screen';
import { RoommateOnboardingSheet } from '@/components/roommate/roommate-onboarding-sheet';
import { useAuth } from '@/context/auth-context';
import { useRoommateVisibility } from '@/hooks/useRoommateVisibility';
import { useRoommates } from '@/hooks/useRoommates';
import type { RoommateProfile } from '@/types/roommates';
import { DesignColors } from '@/constants/design';

type Props = {
  itemHeight: number;
  query: string;
  onQueryChange: (value: string) => void;
};

export function RoommateDeck({ itemHeight, query, onQueryChange }: Props) {
  const router = useRouter();
  const { needsOnboarding } = useRoommateVisibility();
  const { profile } = useAuth();
  const listRef = useRef<FlatList<RoommateProfile>>(null);

  const { data: allRoommates = [], isLoading, isRefetching, refetch } = useRoommates();

  const filtered = useMemo(() => {
    const others = profile?.id ? allRoommates.filter((p) => p.id !== profile.id) : allRoommates;
    const q = query.trim().toLowerCase();
    if (!q) return others;
    return others.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q),
    );
  }, [query, allRoommates, profile?.id]);

  const onViewProfile = useCallback(
    (id: string) => {
      router.push(`/roommate/${id}`);
    },
    [router],
  );

  const onSayHello = useCallback(
    (id: string) => {
      router.push(`/messages/${id}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: RoommateProfile }) => (
      <View style={{ height: itemHeight }}>
        <RoommateDeckCard profile={item} onViewProfile={onViewProfile} onSayHello={onSayHello} />
      </View>
    ),
    [itemHeight, onViewProfile, onSayHello],
  );

  const keyExtractor = useCallback((item: RoommateProfile) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight],
  );

  if (needsOnboarding) {
    return <RoommateOnboardingSheet visible onDismiss={() => {}} />;
  }

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={DesignColors.primaryBright} />
      </View>
    );
  }

  if (allRoommates.length === 0 && !isRefetching) {
    return (
      <NoResultsFoundScreen
        query={query}
        onQueryChange={onQueryChange}
        onAdjustFilters={() => {}}
        onRefresh={() => refetch()}
        refreshing={isRefetching}
        subtitle="No roommates have joined yet. Be the first to complete your profile!"
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        removeClippedSubviews
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        getItemLayout={getItemLayout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
