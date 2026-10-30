export interface UploadProgressTracker {
  onChunkComplete: (bytesAccepted: number) => void;
  onProgress: (bytesSent: number, bytesTotal: number) => void;
}

/**
 * React Native's Android upload progress counts every byte twice
 * (ProgressRequestBody's write(ByteArray) delegates to its own write(Int)), and
 * tus adds that to the chunk's start offset, so raw progress overshoots each
 * chunk, drops back at the next one and ends above 100%. Trust the bytes the
 * server confirmed, let the in-flight chunk add at most its own size, and never
 * move backwards.
 */
export function createUploadProgressTracker(
  chunkBytes: number,
  onProgress: (fraction: number) => void,
): UploadProgressTracker {
  let confirmed = 0;
  let shown = 0;
  return {
    onChunkComplete(bytesAccepted) {
      confirmed = Math.max(confirmed, bytesAccepted);
    },
    onProgress(bytesSent, bytesTotal) {
      if (bytesTotal <= 0) return;
      const inFlight = Math.min(Math.max(bytesSent, confirmed), confirmed + chunkBytes, bytesTotal);
      shown = Math.max(shown, inFlight / bytesTotal);
      onProgress(shown);
    },
  };
}
