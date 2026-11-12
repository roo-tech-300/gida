import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

const SUPPORT_IDS_STALE_MS = 10 * 60 * 1000;

/**
 * Ids of Gida staff. A chat with one of them is "Gida Support", not a stranger's DM.
 * admin_profiles is publicly readable and tiny, so one cached query covers the whole inbox.
 */
export function useSupportIds(): ReadonlySet<string> {
  const { data } = useQuery({
    queryKey: ['support-ids'],
    queryFn: async () => {
      const { data: rows, error } = await supabase.from('admin_profiles').select('id');
      if (error) {
        console.error('[useSupportIds] Failed to load staff ids:', error.message);
        throw new Error(error.message);
      }
      return (rows ?? []).map((row) => row.id as string);
    },
    staleTime: SUPPORT_IDS_STALE_MS,
  });
  return useMemo(() => new Set(data ?? []), [data]);
}
