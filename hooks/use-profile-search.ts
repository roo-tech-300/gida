import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export type ProfileSearchItem = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

async function searchProfiles(query: string): Promise<ProfileSearchItem[]> {
  if (!query.trim()) return [];

  const userId = await currentUserId();
  let builder = supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .or(`full_name.ilike.%${query.trim()}%,username.ilike.%${query.trim()}%`);
  if (userId) {
    builder = builder.neq('id', userId);
  }

  const { data, error } = await builder.limit(10);

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
