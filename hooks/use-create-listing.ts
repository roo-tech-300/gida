import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createListing, CreateListingInput } from '@/services/listing-service';

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateListingInput) => createListing(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
