import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { HERO_HEIGHT } from './constants';

type Props = {
  photos: string[];
  hasVideo: boolean;
  onPhotoPress: (index: number) => void;
  onVideoPress: () => void;
};

/** Swipeable photo carousel. Tapping a photo opens the full-screen gallery at that photo. */
export function PropertyHero({ photos, hasVideo, onPhotoPress, onVideoPress }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <View style={[styles.empty, { height: HERO_HEIGHT }]}>
        <Ionicons name="images-outline" size={40} color={DesignColors.outline} />
        <Text style={styles.emptyText}>No photos yet</Text>
      </View>
    );
  }

  return (
    <View style={{ height: HERO_HEIGHT }}>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${i}-${uri}`}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        initialNumToRender={1}
        windowSize={3}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index: i }) => (
          <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1} of ${photos.length}`} onPress={() => onPhotoPress(i)}>
            <Image source={{ uri: item }} style={{ width, height: HERO_HEIGHT }} contentFit="cover" cachePolicy="disk" transition={300} />
          </Pressable>
        )}
      />
      <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']} style={styles.scrim} pointerEvents="none" />
      <View style={styles.pills} pointerEvents="box-none">
        {photos.length > 1 ? (
          <View style={styles.pill}><Text style={styles.pillText}>{index + 1} / {photos.length}</Text></View>
        ) : null}
        {hasVideo ? (
          <Pressable accessibilityRole="button" onPress={onVideoPress} style={styles.pill}>
            <Ionicons name="play" size={12} color={DesignColors.onSurface} />
            <Text style={styles.pillText}>Video tour</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm, backgroundColor: DesignColors.surfaceContainerLow },
  emptyText: { fontFamily, fontSize: 14, color: DesignColors.outline },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 130 },
  pills: { position: 'absolute', left: DesignSpacing.md, bottom: DesignSpacing.lg + 12, flexDirection: 'row', gap: DesignSpacing.sm },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 26, borderRadius: 13, backgroundColor: DesignColors.scrimHeavy },
  pillText: { fontFamily, fontSize: 12, fontWeight: '700', color: DesignColors.onSurface },
});
