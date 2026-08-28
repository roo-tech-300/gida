import { FlatList, StyleSheet, View } from 'react-native';

import { SearchListingResult } from '@/components/search/search-listing-result';
import { SearchRoommateResult } from '@/components/search/search-roommate-result';
import { SearchEmptyState } from '@/components/search/search-empty-state';
import type { SearchMode } from '@/components/search/search-mode-tabs';
import type { ListingSearchResult, RoommateSearchResult } from '@/services/search-service';

type Props = {
  mode: SearchMode;
  query: string;
  isLoading: boolean;
  listings: ListingSearchResult[];
  roommates: RoommateSearchResult[];
  onPressListing: (id: string) => void;
  onPressRoommate: (id: string) => void;
};

export function SearchResultsList({
  mode,
  query,
  isLoading,
  listings,
  roommates,
  onPressListing,
  onPressRoommate,
}: Props) {
  const hasQuery = query.trim().length >= 2;

  if (!hasQuery || isLoading) {
    return <SearchEmptyState query={query} isLoading={isLoading} />;
  }

  if (mode === 'listings') {
    if (listings.length === 0) {
      return <SearchEmptyState query={query} isLoading={false} />;
    }
    return (
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SearchListingResult listing={item} onPress={onPressListing} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    );
  }

  if (roommates.length === 0) {
    return <SearchEmptyState query={query} isLoading={false} />;
  }

  return (
    <FlatList
      data={roommates}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <SearchRoommateResult roommate={item} onPress={onPressRoommate} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
