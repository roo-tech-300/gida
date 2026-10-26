import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DiscoverEmptyState } from '@/components/discover/discover-empty-state';
import { PlaceDetailContent } from '@/components/discover/place-detail-content';
import { PlaceDetailHero } from '@/components/discover/place-detail-hero';
import { PlaceDetailReviews } from '@/components/discover/place-detail-reviews';
import { PlacePhotoGallery } from '@/components/discover/place-photo-gallery';
import { PlaceRatingSheet } from '@/components/discover/place-rating-sheet';
import { BackButton } from '@/components/ui/back-button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { NetworkErrorScreen } from '@/components/ui/network-error-screen';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { useSavedPlaces } from '@/hooks/use-saved-places';
import { fetchPlaceById, fetchPlaceRatings, upsertPlaceRating } from '@/services/places-service';
import { supabase } from '@/lib/supabase';
import type { PlaceReview } from '@/types/place';
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

  const { data: dbReviews = [] } = useQuery({
    queryKey: ['place-ratings', id],
    queryFn: () => fetchPlaceRatings(id),
    enabled: id.length > 0,
    staleTime: 60 * 1000,
  });

  const [localReviews, setLocalReviews] = useState<PlaceReview[]>([]);
  const [rating, setRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  // Sync rating/ratingCount from DB once place loads
  useEffect(() => {
    if (place) {
      setRating(place.rating);
      setRatingCount(place.ratingCount);
    }
  }, [place]);

  const reviews = [...localReviews, ...dbReviews];

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

  const handleSubmitRating = async (value: number, text: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        showToast({ type: 'error', message: 'Please sign in to rate this place.' });
        return;
      }

      await upsertPlaceRating(place.id, value, userId);

      setLocalReviews((current) => [
        {
          id: `local-${Date.now()}`,
          placeId: place.id,
          author: 'You',
          initials: 'YO',
          rating: value,
          text: text.length > 0 ? text : 'Rated this place.',
          createdAt: 'Just now',
        },
        ...current,
      ]);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['place', id] }),
        queryClient.invalidateQueries({ queryKey: ['place-ratings', id] }),
        queryClient.invalidateQueries({ queryKey: ['places', 'discover'] }),
      ]);

      const updated = queryClient.getQueryData<any>(['place', id]);
      if (updated) {
        setRating(updated.rating);
        setRatingCount(updated.ratingCount);
      }

      showToast({ type: 'success', message: 'Thanks! Your rating was saved.' });
    } catch (error) {
      console.error('[PlaceDetail] Failed to submit rating:', error);
      showToast({ type: 'error', message: 'Could not save your rating. Please try again.' });
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
            <PlaceDetailReviews
              reviews={reviews}
              rating={rating}
              ratingCount={ratingCount}
              onRate={() => setSheetVisible(true)}
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

        <PlaceRatingSheet
          visible={sheetVisible}
          placeName={place.name}
          onClose={() => setSheetVisible(false)}
          onSubmit={handleSubmitRating}
        />

        <PlacePhotoGallery
          photos={place.images?.split(',').filter(Boolean) ?? []}
          visible={galleryVisible}
          onClose={() => setGalleryVisible(false)}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  sheet: {
    marginTop: -28,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  cta: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: DesignColors.primary,
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: DesignColors.onPrimary,
    fontFamily,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  notFoundHeader: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
  },
});
