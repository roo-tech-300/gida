import { supabase } from '@/lib/supabase';
import type { AppRelease, ReleaseTrack } from '@/types/app-release';
import { parseAppRelease } from '@/utils/app-release-mapper';

const COLUMNS = 'track, version_name, build_number, apk_url, release_notes, min_supported_version, published_at';

/** Newest Android release on a track; production apps never see preview rows. */
export async function fetchLatestRelease(track: ReleaseTrack): Promise<AppRelease | null> {
  const { data, error } = await supabase
    .from('app_releases')
    .select(COLUMNS)
    .eq('platform', 'android')
    .eq('track', track)
    .order('build_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? parseAppRelease(data) : null;
}
