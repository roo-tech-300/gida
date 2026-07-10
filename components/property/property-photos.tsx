import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { photoGallery } from '@/dummy/photo-gallery-mock';

export function PropertyPhotos() {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Photos</Text>
      <View style={styles.grid}>
        {photoGallery.map((photo, index) => (
          <Image
            key={index}
            source={photo}
            style={[styles.image, index === 0 && styles.imageHero]}
            contentFit="cover"
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: DesignSpacing.xl,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    marginBottom: DesignSpacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  image: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  imageHero: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 0,
  },
});
