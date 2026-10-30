import { DetailedError, Upload } from 'tus-js-client';
import { getAccessToken } from '@/services/listing-video-service';
import type { PickedVideo, UploadableFile } from '@/utils/pick-listing-video';
import { mediaServerUrl } from '@/utils/media-url';
import { createUploadProgressTracker } from '@/utils/upload-progress';

// Small enough that a dropped mobile connection only loses one chunk.
const CHUNK_BYTES = 5 * 1024 * 1024;
const RETRY_DELAYS_MS = [0, 3000, 10000, 30000, 60000];

export class UploadCanceledError extends Error {
  constructor() {
    super('Upload canceled');
  }
}

export interface UploadHandle {
  done: Promise<void>;
  abort: () => void;
}

type TusInput = ConstructorParameters<typeof Upload>[0];

/**
 * tus-js-client's React Native build reads `{ uri }` objects (see its
 * fileReader), but its typings only list browser/Node inputs.
 */
function toTusInput(file: UploadableFile): TusInput {
  return file as TusInput;
}

function describeError(error: Error): string {
  if (error instanceof DetailedError) {
    const status = error.originalResponse?.getStatus();
    const body = error.originalResponse?.getBody()?.trim();
    if (status && status >= 400 && status < 500 && body) return body;
    if (!error.originalResponse) return 'Network problem. Check your connection and try again.';
  }
  return 'Upload failed. Please try again.';
}

/** Client errors (bad file, no access, limit reached) won't fix themselves. */
function shouldRetry(error: DetailedError): boolean {
  const status = error.originalResponse?.getStatus() ?? 0;
  return !(status >= 400 && status < 500 && status !== 408 && status !== 423 && status !== 429);
}

export function uploadListingVideo(
  listingId: string,
  video: PickedVideo,
  onProgress: (fraction: number) => void,
): UploadHandle {
  let upload: Upload | null = null;
  let rejectDone: (error: Error) => void = () => {};
  // Android reports inflated per-chunk progress; see createUploadProgressTracker.
  const progress = createUploadProgressTracker(CHUNK_BYTES, onProgress);

  const done = new Promise<void>((resolve, reject) => {
    rejectDone = reject;
    upload = new Upload(toTusInput(video.file), {
      endpoint: mediaServerUrl('/uploads'),
      chunkSize: CHUNK_BYTES,
      retryDelays: RETRY_DELAYS_MS,
      metadata: { listingId, filetype: video.mimeType, filename: video.fileName },
      storeFingerprintForResuming: false,
      // Fetch the token per request: Supabase refreshes it during long uploads.
      onBeforeRequest: async (req) => {
        req.setHeader('Authorization', `Bearer ${await getAccessToken()}`);
      },
      onShouldRetry: (error) => shouldRetry(error),
      onProgress: progress.onProgress,
      onChunkComplete: (_chunkSize, bytesAccepted) => progress.onChunkComplete(bytesAccepted),
      onSuccess: () => resolve(),
      onError: (error) => reject(new Error(describeError(error))),
    });
    upload.start();
  });

  return {
    done,
    abort: () => {
      rejectDone(new UploadCanceledError());
      upload?.abort(true).catch((error: unknown) => {
        console.error('[ListingVideoUpload] Failed to cancel upload on the server:', error);
      });
    },
  };
}
