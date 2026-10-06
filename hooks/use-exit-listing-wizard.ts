import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { useCreateListingForm } from '@/context/create-listing-context';

/**
 * Exit-the-whole-wizard navigation.
 *
 * The wizard slides are separate routes pushed with router.push, so the
 * default back behaviour (top-left button / Android hardware back) would walk
 * backwards slide-by-slide. Instead, exiting from ANY slide returns to where
 * the user came from before entering the wizard:
 *  - edit mode  -> back to that listing's detail page
 *  - create mode -> back to wherever they entered from
 * and resets the draft form state.
 *
 * Exit is silent (no discard confirm) per product decision.
 */
export function useExitListingWizard() {
  const { reset, editListingId } = useCreateListingForm();

  const exitWizard = useCallback(() => {
    const id = editListingId;
    reset();
    // Dismiss first so the wizard slides (steps 1-5) are removed from the
    // stack; otherwise the landing screen's back button would pop back into
    // the wizard (e.g. step 4). Then replace lands on a clean history.
    if (router.canDismiss()) {
      router.dismissAll();
    }
    if (id) {
      router.replace(`/admin/listing/${id}`);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/admin/total-inventory');
    }
  }, [reset, editListingId]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        exitWizard();
        return true;
      });
      return () => subscription.remove();
    }, [exitWizard]),
  );

  return exitWizard;
}
