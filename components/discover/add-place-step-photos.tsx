import { StyleSheet, Text, View } from 'react-native';

import { AddImages } from '@/components/ui/add-images';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';

type Props = {
  photos: string[];
  onPickPhotos: () => void;
  onRemovePhoto: (index: number) => void;
};

export function AddPlaceStepPhotos({ photos, onPickPhotos, onRemovePhoto }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Upload up to 10 photos of the interior, seating, facade, or menu. Photos make places stand out in Discover recommendations.
      </Text>

      <View style={styles.gridWrap}>
        <AddImages
          hasImages={photos.length > 0}
          images={photos}
          layout="grid"
          onPress={onPickPhotos}
          onRemove={onRemovePhoto}
          selectedCount={photos.length}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
    gap: DesignSpacing.md,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  gridWrap: {
    marginTop: DesignSpacing.xs,
  },
});
