import { ImageGalleryModal } from '@/components/property/image-gallery-modal';

type PlacePhotoGalleryProps = {
  photos: string[];
  visible: boolean;
  onClose: () => void;
};

export function PlacePhotoGallery({ photos, visible, onClose }: PlacePhotoGalleryProps) {
  return (
    <ImageGalleryModal
      photos={photos}
      initialIndex={0}
      visible={visible}
      onClose={onClose}
    />
  );
}
