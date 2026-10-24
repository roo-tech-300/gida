import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useAppToast } from '@/components/ui/toast-card';
import { EMPTY_PLACE_DRAFT } from '@/constants/place-form';
import { createPlace } from '@/services/place-creation-service';
import { PLACES_QUERY_KEY } from '@/services/places-service';
import type { PlaceCategory, PlaceDraft, PlaceDraftErrors } from '@/types/place';
import { validateBasicStep } from '@/utils/validate-place-draft';

export type AddPlaceStep = 1 | 2 | 3 | 4 | 5;

export function useAddPlaceForm(userId: string | undefined) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();

  const [step, setStep] = useState<AddPlaceStep>(1);
  const [draft, setDraft] = useState<PlaceDraft>(EMPTY_PLACE_DRAFT);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<PlaceDraftErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const updateDraft = useCallback(<K extends keyof PlaceDraft>(key: K, value: PlaceDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const selectCategory = useCallback((category: PlaceCategory) => {
    updateDraft('category', category);
  }, [updateDraft]);

  const lockLocation = useCallback(async () => {
    if (Platform.OS === 'web') {
      showToast({ type: 'info', message: 'GPS lock is available on mobile devices.' });
      return;
    }
    setIsLocating(true);
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast({ type: 'error', message: 'Location permission was denied.' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      updateDraft('latitude', loc.coords.latitude);
      updateDraft('longitude', loc.coords.longitude);
      showToast({ type: 'success', message: 'Current coordinates locked successfully!' });
    } catch (err) {
      console.warn('[AddPlace] Could not fetch location:', err);
      showToast({ type: 'error', message: 'Could not fetch your location. Make sure GPS is enabled.' });
    } finally {
      setIsLocating(false);
    }
  }, [showToast, updateDraft]);

  const clearLocation = useCallback(() => {
    updateDraft('latitude', undefined);
    updateDraft('longitude', undefined);
  }, [updateDraft]);

  const setGallery = useCallback((images: string[]) => {
    setGalleryImages(images);
  }, []);

  const removeGalleryImage = useCallback((uri: string) => {
    setGalleryImages((prev) => prev.filter((u) => u !== uri));
  }, []);

  const nextStep = useCallback(() => {
    if (step === 1) {
      if (!draft.category) {
        showToast({ type: 'error', message: 'Please choose a category to continue.' });
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const stepErrors = validateBasicStep(draft);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        showToast({ type: 'error', message: 'Please fill in all required fields.' });
        return;
      }
      setErrors({});
      setStep(3);
      return;
    }
    if (step === 3) { setStep(4); return; }
    if (step === 4) { setStep(5); }
  }, [draft, showToast, step]);

  const prevStep = useCallback(() => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as AddPlaceStep);
    } else {
      router.back();
    }
  }, [router, step]);

  const submit = useCallback(async () => {
    if (!userId) {
      showToast({ type: 'error', message: 'You must be signed in to add a place.' });
      return;
    }
    const stepErrors = validateBasicStep(draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setStep(2);
      showToast({ type: 'error', message: 'Please correct the highlighted errors.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const allPhotos = [...galleryImages];
      const createdId = await createPlace({ draft, photos: allPhotos, userId });
      await queryClient.invalidateQueries({ queryKey: PLACES_QUERY_KEY });
      showToast({ type: 'success', message: `${draft.name} added to Discover!` });
      router.replace(`/place/${createdId}` as never);
    } catch (err) {
      console.error('[AddPlace] Submit failed:', err);
      showToast({ type: 'error', message: 'Failed to create place. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, galleryImages, queryClient, router, showToast, userId]);

  return {
    step,
    draft,
    galleryImages,
    errors,
    isSubmitting,
    isLocating,
    updateDraft,
    selectCategory,
    lockLocation,
    clearLocation,
    setGallery,
    removeGalleryImage,
    nextStep,
    prevStep,
    submit,
  };
}
