import type { Server } from '@tus/server';
import type { TranscodeQueue } from './queue.ts';
import type { MediaStorage } from './storage.ts';
import type { VideoRepository } from './supabase.ts';

const ORPHAN_GRACE_MS = 60 * 60 * 1000;
const JANITOR_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface CleanupDeps {
  storage: MediaStorage;
  videos: VideoRepository;
  queue: TranscodeQueue;
  uploads: Server;
}

/** On boot: rebuild the queue from Supabase. Nothing is running yet, so old work folders are junk. */
export async function recoverJobs({ storage, videos, queue }: CleanupDeps): Promise<void> {
  await storage.clearWork();
  for (const row of await videos.listUnfinished()) {
    if (await storage.rawExists(row.id)) {
      queue.enqueue(row.id);
    } else {
      await videos.update(row.id, { status: 'failed', error: 'The upload was lost before processing. Please upload again.' });
    }
  }
  console.log(`[recover] ${queue.size} job(s) re-queued`);
}

/**
 * Removes abandoned tus uploads and published folders whose row is gone
 * (e.g. the listing was deleted and the cascade removed its videos).
 */
export async function sweep({ storage, videos, uploads }: CleanupDeps): Promise<void> {
  const expired = await uploads.cleanUpExpiredUploads();

  const cutoff = Date.now() - ORPHAN_GRACE_MS;
  const candidates = (await storage.listPublished()).filter((folder) => folder.modifiedAt < cutoff);
  const known = await videos.existingIds(candidates.map((folder) => folder.id));
  const orphans = candidates.filter((folder) => !known.has(folder.id));
  await Promise.all(orphans.map((folder) => storage.removeAll(folder.id)));

  console.log(`[janitor] removed ${expired} abandoned upload(s), ${orphans.length} orphaned video(s)`);
}

export function startJanitor(deps: CleanupDeps): NodeJS.Timeout {
  const run = () => {
    sweep(deps).catch((error: unknown) => console.error('[janitor] Sweep failed:', error));
  };
  run();
  return setInterval(run, JANITOR_INTERVAL_MS);
}
