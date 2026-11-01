import type { ListingVideo } from '@/types/listing-video';
import type { PickedVideo } from '@/utils/pick-listing-video';

/**
 * One item in the listing wizard's media step. Photos are either local URIs
 * (new picks) or already-uploaded URLs (editing). Videos are either picked on
 * this device (uploaded after saving) or already on the media server.
 */
export type WizardMedia =
  | { kind: 'photo'; uri: string }
  | { kind: 'video'; video: PickedVideo }
  | { kind: 'uploaded-video'; video: ListingVideo };

export function isPhotoMedia(media: WizardMedia): media is Extract<WizardMedia, { kind: 'photo' }> {
  return media.kind === 'photo';
}

export function isNewVideoMedia(media: WizardMedia): media is Extract<WizardMedia, { kind: 'video' }> {
  return media.kind === 'video';
}

/** True for both new and already-uploaded videos. */
export function isVideoMedia(media: WizardMedia | null): boolean {
  return media !== null && media.kind !== 'photo';
}

/** Stable list key; the index disambiguates the same photo picked twice. */
export function wizardMediaKey(media: WizardMedia, index: number): string {
  if (media.kind === 'photo') return `photo-${index}-${media.uri.slice(-32)}`;
  if (media.kind === 'video') return `video-${index}-${media.video.fileName}`;
  return `uploaded-${media.video.id}`;
}

export function photoUris(media: WizardMedia[]): string[] {
  return media.filter(isPhotoMedia).map((item) => item.uri);
}

/** Photos and videos both count toward the video limit. */
export function countVideos(media: WizardMedia[]): number {
  return media.filter((item) => item.kind !== 'photo').length;
}
