import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { getSavedIds, getSavedListings, saveListing, unsaveListing } from '@/services/saved-listing-service';

export function useSavedIds() {
  const { profile } = useAuth();
  const userId = profile?.id;

  return useQuery({
    queryKey: ['saved-ids', userId],
    queryFn: () => getSavedIds(userId!),
    enabled: !!userId,
  });
}

export function useSavedListings() {
  const { profile } = useAuth();
  const userId = profile?.id;

  return useQuery({
    queryKey: ['saved-listings', userId],
    queryFn: () => getSavedListings(userId!),
    enabled: !!userId,
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const userId = profile?.id;
  const { data: savedIds } = useSavedIds();

  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!userId) throw new Error('Not authenticated');
      const isSaved = savedIds?.includes(listingId);
      if (isSaved) {
        await unsaveListing(userId, listingId);
      } else {
        await saveListing(userId, listingId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-ids', userId] });
      queryClient.invalidateQueries({ queryKey: ['saved-listings', userId] });
    },
  });
}
