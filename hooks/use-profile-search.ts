import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

async function searchProfiles(query: string): Promise<{ id: string; full_name: string | null; avatar_url: string | null }[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .ilike('full_name', `%${query.trim()}%`)
    .limit(10);

  if (error) throw error;
  return data || [];
}

export function useSearchProfiles(query: string) {
  return useQuery({
    queryKey: ['search-profiles', query],
    queryFn: () => searchProfiles(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}
