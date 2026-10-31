import { useMemo } from 'react';

import { ImageGalleryModal } from '@/components/property/image-gallery-modal';
import type { GalleryMedia } from '@/types/gallery-media';

type PlacePhotoGalleryProps = {
  photos: string[];
  visible: boolean;
  onClose: () => void;
};

export function PlacePhotoGallery({ photos, visible, onClose }: PlacePhotoGalleryProps) {
  const media = useMemo<GalleryMedia[]>(
    () => photos.map((uri) => ({ type: 'photo', uri })),
    [photos],
  );

  return <ImageGalleryModal media={media} initialIndex={0} visible={visible} onClose={onClose} />;
}
