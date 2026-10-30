import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from './env.ts';

export type VideoStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface ListingVideoRow {
  id: string;
  listing_id: string;
  uploaded_by: string;
  status: VideoStatus;
  hls_path: string | null;
  poster_path: string | null;
  preview_path: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  display_order: number;
  error: string | null;
  created_at: string;
}

export type ListingVideoUpdate = Partial<
  Pick<
    ListingVideoRow,
    'status' | 'hls_path' | 'poster_path' | 'preview_path' | 'duration_seconds' | 'width' | 'height' | 'error'
  >
>;

export function createServiceClient(env: Env): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const ID_CHUNK = 200;

export class VideoRepository {
  private readonly db: SupabaseClient;

  constructor(db: SupabaseClient) {
    this.db = db;
  }

  async get(id: string): Promise<ListingVideoRow | null> {
    const { data, error } = await this.db.from('listing_videos').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as ListingVideoRow | null;
  }

  /** Videos that still count toward the per-listing limit (failed ones don't). */
  async countActive(listingId: string): Promise<number> {
    const { count, error } = await this.db
      .from('listing_videos')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .neq('status', 'failed');
    if (error) throw error;
    return count ?? 0;
  }

  async insertQueued(id: string, listingId: string, uploadedBy: string, displayOrder: number): Promise<void> {
    const { error } = await this.db.from('listing_videos').insert({
      id,
      listing_id: listingId,
      uploaded_by: uploadedBy,
      status: 'queued',
      display_order: displayOrder,
    });
    if (error) throw error;
  }

  async update(id: string, patch: ListingVideoUpdate): Promise<void> {
    const { error } = await this.db.from('listing_videos').update(patch).eq('id', id);
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('listing_videos').delete().eq('id', id);
    if (error) throw error;
  }

  async listUnfinished(): Promise<ListingVideoRow[]> {
    const { data, error } = await this.db
      .from('listing_videos')
      .select('*')
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ListingVideoRow[];
  }

  async existingIds(ids: string[]): Promise<Set<string>> {
    const found = new Set<string>();
    // Chunked so the `in` filter stays well under URL length limits.
    for (let start = 0; start < ids.length; start += ID_CHUNK) {
      const { data, error } = await this.db
        .from('listing_videos')
        .select('id')
        .in('id', ids.slice(start, start + ID_CHUNK));
      if (error) throw error;
      for (const row of (data ?? []) as { id: string }[]) found.add(row.id);
    }
    return found;
  }
}
