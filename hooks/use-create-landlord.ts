import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLandlord, CreateLandlordInput } from '@/services/landlord-service';

export function useCreateLandlord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLandlordInput) => createLandlord(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlords'] });
    },
  });
}
