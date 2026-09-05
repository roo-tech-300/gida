import { supabase } from '@/lib/supabase';
import { chunkArray, MAX_CHUNK_SIZE } from '@/utils/array';

const MAX_IN_IDS = MAX_CHUNK_SIZE;

export function chunkInIds(ids: string[]): string[][] {
  return chunkArray(ids, MAX_IN_IDS);
}

export async function fetchProfilesInChunks(ids: string[]): Promise<Record<string, { id: string; full_name: string; avatar_url: string | null }>> {
  if (ids.length === 0) return {};

  const chunks = chunkInIds(ids);
  const map: Record<string, { id: string; full_name: string; avatar_url: string | null }> = {};

  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', chunk);

    if (error) {
      console.error('[ProfileChunk] Failed to fetch profiles:', error.message);
      continue;
    }

    for (const row of data ?? []) {
      map[row.id] = {
        id: row.id,
        full_name: row.full_name || 'Gida user',
        avatar_url: row.avatar_url || null,
      };
    }
  }

  return map;
}