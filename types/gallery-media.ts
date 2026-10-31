import type { ReadyListingVideo } from './listing-video';

/** One item in a listing's media gallery: a photo or a ready walkthrough video. */
export type GalleryMedia =
  | { type: 'photo'; uri: string }
  | { type: 'video'; video: ReadyListingVideo };

export function mediaKey(item: GalleryMedia, index: number): string {
  return item.type === 'photo' ? `photo-${index}` : `video-${item.video.id}`;
}
