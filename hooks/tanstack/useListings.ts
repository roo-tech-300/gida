import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useListings() {
  return useQuery({
    queryKey: ['listings'], // 👈 React Query uses this key to handle caching lookups
    queryFn: async () => {
      const { data, error } = await supabase.from('listings').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });
}