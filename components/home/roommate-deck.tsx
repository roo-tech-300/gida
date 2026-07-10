import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { RoommateDeckCard } from '@/components/home/roommate-deck-card';
import { roommateProfiles } from '@/dummy/roommates-mock';
import type { RoommateProfile } from '@/types/roommates';

type Props = {
  itemHeight: number;
  query: string;
  onQueryChange: (value: string) => void;
};

export function RoommateDeck({ itemHeight, query }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<RoommateProfile>>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roommateProfiles;
    return roommateProfiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.university.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q),
    );
  }, [query]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1300);
  }, []);

  const onViewProfile = useCallback((id: string) => {
    // TODO: navigate to profile detail
  }, []);

  const onSayHello = useCallback((id: string) => {
    // TODO: open chat or message composer
  }, []);

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
        refreshing={refreshing}
        onRefresh={onRefresh}
        getItemLayout={getItemLayout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e10',
  },
});
