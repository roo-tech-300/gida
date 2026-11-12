import { supabase } from '@/lib/supabase';
import { routeConversationPair, type RoutedPair } from '@/utils/support-routing';

const CACHE_MS = 10 * 60 * 1000;

interface StaffDirectory {
  supportAdminId: string | null;
  staffIds: ReadonlySet<string>;
  loadedAt: number;
}

let directory: StaffDirectory | null = null;
let inflight: Promise<StaffDirectory> | null = null;

async function loadDirectory(): Promise<StaffDirectory> {
  const [supportResult, staffResult] = await Promise.all([
    supabase.rpc('get_support_admin_id'),
    supabase.from('admin_profiles').select('id'),
  ]);
  if (supportResult.error || staffResult.error) {
    const message = supportResult.error?.message ?? staffResult.error?.message ?? 'unknown';
    console.error('[SupportRouting] Failed to load the staff directory:', message);
    throw new Error(message);
  }
  return {
    supportAdminId: (supportResult.data as string | null) ?? null,
    staffIds: new Set((staffResult.data ?? []).map((row) => row.id as string)),
    loadedAt: Date.now(),
  };
}

/** Staff ids and the support admin change rarely, so one cached lookup serves every chat call. */
export async function getStaffDirectory(): Promise<StaffDirectory> {
  if (directory && Date.now() - directory.loadedAt < CACHE_MS) return directory;
  inflight ??= loadDirectory()
    .then((loaded) => {
      directory = loaded;
      return loaded;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function resetStaffDirectoryCache(): void {
  directory = null;
}

/** Falls back to the plain pair if the directory cannot load, so chat keeps working. */
export async function routePair(myId: string, otherId: string): Promise<RoutedPair> {
  try {
    const { supportAdminId, staffIds } = await getStaffDirectory();
    return routeConversationPair({ myId, otherId, supportAdminId, isStaff: (id) => staffIds.has(id) });
  } catch {
    return { firstId: myId, secondId: otherId, readerId: myId, otherId };
  }
}
