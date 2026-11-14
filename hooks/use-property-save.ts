import { useAppToast } from '@/components/ui/toast-card';
import { useSavedIds, useToggleSave } from '@/hooks/use-saved-listings';

/** Heart state and toggle for one listing, with the same toasts the page always showed. */
export function usePropertySave(listingId: string) {
  const { showToast } = useAppToast();
  const { data: savedIds = [] } = useSavedIds();
  const toggleSave = useToggleSave();
  const isSaved = savedIds.includes(listingId);

  const toggle = () => {
    toggleSave.mutate(listingId, {
      onSuccess: () => {
        showToast({ message: isSaved ? 'Removed from your saved listings.' : 'Saved to your listings.', type: 'success' });
      },
      onError: (error) => {
        console.error('[PropertyDetails] Failed to toggle save:', error);
        showToast({ message: 'Could not update saved listings. Please try again.', type: 'error' });
      },
    });
  };

  return { isSaved, toggle };
}
