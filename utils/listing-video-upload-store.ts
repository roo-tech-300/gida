/**
 * In-flight uploads, kept outside React so an upload survives the admin
 * leaving the listing screen. One upload per listing at a time.
 */
export type ListingVideoUploadState =
  | { status: 'uploading'; fileName: string; progress: number }
  | { status: 'failed'; fileName: string; error: string };

const uploads = new Map<string, ListingVideoUploadState>();
const aborts = new Map<string, () => void>();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeToUploads(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUpload(listingId: string): ListingVideoUploadState | null {
  return uploads.get(listingId) ?? null;
}

export function setUpload(listingId: string, state: ListingVideoUploadState): void {
  uploads.set(listingId, state);
  emit();
}

/** Progress events fire constantly; only re-render on whole-percent changes. */
export function setUploadProgress(listingId: string, fileName: string, fraction: number): void {
  const current = uploads.get(listingId);
  const progress = Math.floor(fraction * 100);
  if (current?.status === 'uploading' && current.progress === progress) return;
  setUpload(listingId, { status: 'uploading', fileName, progress });
}

export function clearUpload(listingId: string): void {
  uploads.delete(listingId);
  aborts.delete(listingId);
  emit();
}

export function registerAbort(listingId: string, abort: () => void): void {
  aborts.set(listingId, abort);
}

export function abortUpload(listingId: string): void {
  aborts.get(listingId)?.();
  clearUpload(listingId);
}
