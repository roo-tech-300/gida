import { useAuth } from '@/context/auth-context';
import { getPlaceSavedIds, savePlace, unsavePlace } from '@/services/saved-listing-service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const SAVED_PLACE_IDS_KEY = (userId: string) => ['saved-place-ids', userId] as const;

export function useSavedPlaces() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const queryClient = useQueryClient();

  const { data: ids = [] } = useQuery({
    queryKey: SAVED_PLACE_IDS_KEY(userId ?? ''),
    queryFn: () => getPlaceSavedIds(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const { mutate: toggle } = useMutation({
    mutationFn: async (placeId: string) => {
      if (!userId) throw new Error('Not authenticated');
      if (ids.includes(placeId)) {
        await unsavePlace(userId, placeId);
      } else {
        await savePlace(userId, placeId);
      }
    },
    onMutate: async (placeId) => {
      // Optimistic update — flip the id immediately
      await queryClient.cancelQueries({ queryKey: SAVED_PLACE_IDS_KEY(userId ?? '') });
      const previous = queryClient.getQueryData<string[]>(SAVED_PLACE_IDS_KEY(userId ?? ''));
      queryClient.setQueryData<string[]>(SAVED_PLACE_IDS_KEY(userId ?? ''), (old = []) =>
        old.includes(placeId) ? old.filter((id) => id !== placeId) : [...old, placeId],
      );
      return { previous };
    },
    onError: (_err, _placeId, context) => {
      // Roll back on failure
      if (context?.previous !== undefined) {
        queryClient.setQueryData(SAVED_PLACE_IDS_KEY(userId ?? ''), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_PLACE_IDS_KEY(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: ['saved-items', userId] });
    },
  });

  return {
    ids,
    count: ids.length,
    isSaved: (id: string) => ids.includes(id),
    toggle,
  };
}
