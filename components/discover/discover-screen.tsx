import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { DiscoverCategoryChips } from '@/components/discover/discover-category-chips';
import { DiscoverFab } from '@/components/discover/discover-fab';
import { DiscoverFeedList } from '@/components/discover/discover-feed-list';
import { DiscoverSkeleton } from '@/components/discover/discover-skeleton';
import { AppBottomNav } from '@/components/navigation/app-bottom-nav';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { NetworkErrorScreen } from '@/components/ui/network-error-screen';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { ScreenTitle } from '@/components/ui/screen-title';
import { SearchBar } from '@/components/ui/search-bar';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignSpacing } from '@/constants/design';
import { getPlaceCategoryMeta } from '@/constants/place-categories';
import { useDiscoverFeed } from '@/hooks/use-discover-feed';
import type { Place } from '@/types/place';
import { openPlaceInMaps } from '@/utils/place-maps';

export function DiscoverScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const feed = useDiscoverFeed();
  const { savedIds, toggleSaved } = feed;

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const openPlace = useCallback(
    (place: Place) => {
      router.push(`/place/${place.id}` as Href);
    },
    [router],
  );

  const getDirections = useCallback(
    async (place: Place) => {
      const opened = await openPlaceInMaps(place);
      if (!opened) {
        showToast({ type: 'error', message: 'Could not open Google Maps. Please try again.' });
      }
    },
    [showToast],
  );

  const toggleSave = useCallback(
    (place: Place) => {
      const wasSaved = isSaved(place.id);
      toggleSaved(place.id);
      showToast({
        type: 'success',
        message: wasSaved ? `${place.name} removed from saved.` : `${place.name} saved for later.`,
      });
    },
    [isSaved, showToast, toggleSaved],
  );

  if (feed.isError) {
    return <NetworkErrorScreen activeTab="discover" onRetry={feed.refresh} />;
  }

  const sectionTitle = feed.savedOnly
    ? 'Saved places'
    : feed.query.trim().length > 0
      ? 'Search results'
      : feed.category === 'all'
        ? 'All places'
        : `${getPlaceCategoryMeta(feed.category).label} in Minna`;

  const emptyState = feed.savedOnly
    ? { title: 'Nothing saved yet', message: 'Tap the bookmark on a place to keep it here.' }
    : feed.query.trim().length > 0
      ? {
          title: 'No places found',
          message: `Nothing matches "${feed.query.trim()}". Try a different name or area.`,
        }
      : { title: 'Nothing here yet', message: 'This category is still being mapped. Try another one.' };

  return (
    <ErrorBoundary onReset={feed.refresh}>
      <View style={styles.container}>
        <SafeKeyboardView style={styles.flex}>
          <SafeAreaView edges={['top']} style={styles.safe}>
            <AuthBackgroundBubbles />
            <View style={styles.header}>
              <ScreenTitle title="Discover Places" />
              <View style={styles.searchWrap}>
                <SearchBar
                  placeholder="Search places, areas or vibes..."
                  value={feed.query}
                  onChangeText={feed.setQuery}
                  onClear={() => feed.setQuery('')}
                />
              </View>
              <View style={styles.chipsWrap}>
                <DiscoverCategoryChips
                  active={feed.category}
                  savedOnly={feed.savedOnly}
                  onChange={feed.setCategory}
                  onToggleSaved={feed.toggleSavedOnly}
                />
              </View>
            </View>

            <View style={styles.body}>
              {feed.isLoading ? (
                <DiscoverSkeleton />
              ) : (
                <DiscoverFeedList
                  emptyState={emptyState}
                  feed={feed}
                  isSaved={isSaved}
                  sectionTitle={sectionTitle}
                  onDirections={(place) => void getDirections(place)}
                  onOpenPlace={openPlace}
                  onToggleSave={toggleSave}
                />
              )}
              <DiscoverFab onPress={() => router.push('/place/new' as Href)} />
            </View>

            <AppBottomNav activeTab="discover" />
          </SafeAreaView>
        </SafeKeyboardView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  header: {
    paddingBottom: 8,
  },
  searchWrap: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: 4,
  },
  chipsWrap: {
    paddingTop: 10,
  },
  body: {
    flex: 1,
  },
});
