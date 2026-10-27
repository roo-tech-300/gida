import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { hlsArgs, posterArgs, previewArgs, selectRenditions } from './ladder.ts';
import { parseProbe } from './probe.ts';
import { runProcess } from './run-process.ts';
import { MediaStorage } from './storage.ts';
import type { VideoRepository } from './supabase.ts';

/** Problems worth showing to the admin as-is (anything else gets a generic message). */
class RejectedVideoError extends Error {}

export interface TranscoderDeps {
  storage: MediaStorage;
  videos: VideoRepository;
  maxDurationSeconds: number;
}

export function createTranscoder({ storage, videos, maxDurationSeconds }: TranscoderDeps) {
  return async function transcode(id: string, signal: AbortSignal): Promise<void> {
    const input = storage.rawPath(id);
    const outDir = storage.workPath(id);
    const startedAt = Date.now();

    try {
      await videos.update(id, { status: 'processing', error: null });

      const probeJson = await runProcess(
        'ffprobe',
        ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', input],
        signal,
      );
      let probe;
      try {
        probe = parseProbe(probeJson);
      } catch (error) {
        throw new RejectedVideoError(`This file could not be read as a video (${(error as Error).message}).`);
      }
      if (probe.durationSeconds > maxDurationSeconds + 1) {
        throw new RejectedVideoError(
          `Video is ${Math.round(probe.durationSeconds)}s long; the limit is ${maxDurationSeconds}s.`,
        );
      }

      const renditions = selectRenditions(probe);
      await storage.removeWork(id);
      await Promise.all(renditions.map((r) => mkdir(path.join(outDir, r.name), { recursive: true })));

      await runProcess('ffmpeg', posterArgs(input, path.join(outDir, 'poster.jpg'), probe), signal);
      await runProcess('ffmpeg', previewArgs(input, path.join(outDir, 'preview.mp4'), probe), signal);
      await runProcess('ffmpeg', hlsArgs(input, outDir, probe, renditions), signal);
      if (signal.aborted) return;

      await storage.publish(id);
      await storage.removeRaw(id);

      const top = renditions[renditions.length - 1];
      await videos.update(id, {
        status: 'ready',
        hls_path: MediaStorage.publicPath(id, 'master.m3u8'),
        poster_path: MediaStorage.publicPath(id, 'poster.jpg'),
        preview_path: MediaStorage.publicPath(id, 'preview.mp4'),
        duration_seconds: Math.round(probe.durationSeconds),
        width: top.width,
        height: top.height,
      });
      console.log(`[transcode] ${id} ready in ${Math.round((Date.now() - startedAt) / 1000)}s`);
    } catch (error) {
      await storage.removeWork(id);
      // Cancelled by a delete or by shutdown: the delete handler or the restart
      // recovery owns the row from here.
      if (signal.aborted) return;

      console.error(`[transcode] ${id} failed:`, error);
      await storage.removeRaw(id);
      const message =
        error instanceof RejectedVideoError ? error.message : 'Processing failed. Please try uploading again.';
      await videos.update(id, { status: 'failed', error: message }).catch((updateError: unknown) => {
        console.error(`[transcode] Could not mark ${id} as failed:`, updateError);
      });
    }
  };
}
