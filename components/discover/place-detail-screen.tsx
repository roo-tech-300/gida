import { Ionicons } from '@expo/vector-icons';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DiscoverEmptyState } from '@/components/discover/discover-empty-state';
import { PlaceDetailContent } from '@/components/discover/place-detail-content';
import { PlaceDetailHero } from '@/components/discover/place-detail-hero';
import { PlaceDetailReviews } from '@/components/discover/place-detail-reviews';
import { PlacePhotoGallery } from '@/components/discover/place-photo-gallery';
import { PlaceReviewForm } from '@/components/discover/place-review-form';
import { BackButton } from '@/components/ui/back-button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { NetworkErrorScreen } from '@/components/ui/network-error-screen';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignSpacing } from '@/constants/design';
import { styles } from '@/components/discover/place-detail-screen.styles';
import { useSavedPlaces } from '@/hooks/use-saved-places';
import { fetchPlaceById } from '@/services/places-service';
import { fetchPlaceRatings, upsertPlaceRating } from '@/services/place-ratings-service';
import { supabase } from '@/lib/supabase';
import type { NewPlaceReview, Place, PlaceReview } from '@/types/place';
import { buildPlaceMapsUrl, openPlaceInMaps } from '@/utils/place-maps';

export function PlaceDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useAppToast();
  const { isSaved, toggle } = useSavedPlaces();
  const queryClient = useQueryClient();

  const { data: place, isLoading, isError } = useQuery({
    queryKey: ['place', id],
    queryFn: () => fetchPlaceById(id),
    enabled: id.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const REVIEW_PAGE_SIZE = 10;

  const {
    data: dbReviewPages,
    fetchNextPage: fetchNextReviews,
    hasNextPage: hasMoreReviews,
    isFetching: isFetchingMoreReviews,
  } = useInfiniteQuery<PlaceReview[], Error>({
    queryKey: ['place-ratings', id],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }) =>
      fetchPlaceRatings(id, {
        from: pageParam * REVIEW_PAGE_SIZE,
        to: (pageParam + 1) * REVIEW_PAGE_SIZE - 1,
      }),
    enabled: id.length > 0,
    staleTime: 60 * 1000,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < REVIEW_PAGE_SIZE ? undefined : allPages.length,
  });

  const dbReviews = (dbReviewPages?.pages.flatMap((page) => page) ?? []) as PlaceReview[];

  const [rating, setRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [galleryVisible, setGalleryVisible] = useState(false);
  // Sync rating/ratingCount from DB once place loads
  useEffect(() => {
    if (place) {
      setRating(place.rating);
      setRatingCount(place.ratingCount);
    }
  }, [place]);

  const reviews = dbReviews;

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <View style={styles.notFoundHeader}>
          <BackButton />
        </View>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Error / not found
  if (isError) {
    return (
      <NetworkErrorScreen
        activeTab="discover"
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['place', id] })}
      />
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.notFound}>
        <View style={styles.notFoundHeader}>
          <BackButton />
        </View>
        <DiscoverEmptyState
          title="Place not found"
          message="This place may have moved or the link is out of date."
          actionLabel="Back to Discover"
          onAction={() => router.replace('/(tabs)/discover' as Href)}
        />
      </SafeAreaView>
    );
  }

  const saved = isSaved(place.id);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${place.name} — ${place.address}. ${buildPlaceMapsUrl(place)}`,
      });
    } catch (error) {
      console.error('[PlaceDetail] Failed to share place:', error);
      showToast({ type: 'error', message: 'Could not share this place right now.' });
    }
  };

  const handleDirections = async () => {
    const opened = await openPlaceInMaps(place);
    if (!opened) {
      showToast({ type: 'error', message: 'Could not open Google Maps. Please try again.' });
    }
  };

  const handleToggleSave = () => {
    toggle(place.id);
    showToast({
      type: 'success',
      message: saved ? `${place.name} removed from saved.` : `${place.name} saved for later.`,
    });
  };

  const handleSubmitRating = async (review: NewPlaceReview): Promise<boolean> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        showToast({ type: 'error', message: 'Please sign in to rate this place.' });
        return false;
      }

      await upsertPlaceRating(place.id, userId, review);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['place', id] }),
        queryClient.invalidateQueries({ queryKey: ['place-ratings', id] }),
        queryClient.invalidateQueries({ queryKey: ['places', 'discover'] }),
      ]);

      const updated = queryClient.getQueryData<Place>(['place', id]);
      if (updated) {
        setRating(updated.rating);
        setRatingCount(updated.ratingCount);
      }

      showToast({ type: 'success', message: 'Thanks! Your rating was saved.' });
      return true;
    } catch (error) {
      console.error('[PlaceDetail] Failed to submit rating:', error);
      showToast({ type: 'error', message: 'Could not save your rating. Please try again.' });
      return false;
    }
  };

  return (
    <ErrorBoundary onReset={() => queryClient.invalidateQueries({ queryKey: ['place', id] })}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PlaceDetailHero
            place={place}
            saved={saved}
            onToggleSave={handleToggleSave}
            onShare={() => void handleShare()}
            onPressImage={() => setGalleryVisible(true)}
          />
          <View style={styles.sheet}>
            <PlaceDetailContent place={place} rating={rating} ratingCount={ratingCount} />
            <PlaceReviewForm onSubmit={handleSubmitRating} />
            <PlaceDetailReviews
              reviews={reviews}
              rating={rating}
              ratingCount={ratingCount}
              hasMoreReviews={hasMoreReviews}
              onLoadMoreReviews={() => void fetchNextReviews()}
              isLoadingMoreReviews={isFetchingMoreReviews}
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, DesignSpacing.md) },
          ]}
        >
          <Pressable
            accessibilityLabel={`Get directions to ${place.name}`}
            accessibilityRole="button"
            onPress={() => void handleDirections()}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Ionicons color={DesignColors.onPrimary} name="navigate" size={18} />
            <Text style={styles.ctaLabel}>Get Directions</Text>
          </Pressable>
        </View>

        <PlacePhotoGallery
          photos={place.images?.split(',').filter(Boolean) ?? []}
          visible={galleryVisible}
          onClose={() => setGalleryVisible(false)}
        />
      </View>
    </ErrorBoundary>
  );
}
