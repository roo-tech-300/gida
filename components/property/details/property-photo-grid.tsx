import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { SectionLabel } from './section-label';

const GRID_HEIGHT = 160;

function Tile({ uri, index, label, onPress, children }: { uri: string; index: number; label: string; onPress: (i: number) => void; children?: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="imagebutton" accessibilityLabel={label} onPress={() => onPress(index)} style={styles.tile}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="disk" transition={300} />
      {children}
    </Pressable>
  );
}

/** A big photo with up to two small ones; "+N" on the last small one when there are more. */
export function PropertyPhotoGrid({ photos, onPhotoPress }: { photos: string[]; onPhotoPress: (index: number) => void }) {
  if (photos.length === 0) return null;
  const extra = photos.length - 3;
  const label = (i: number) => `Open photo ${i + 1} of ${photos.length}`;

  return (
    <View style={styles.section}>
      <SectionLabel
        right={
          <Pressable accessibilityRole="button" onPress={() => onPhotoPress(0)} hitSlop={8}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        }
      >
        {`PHOTOS · ${photos.length}`}
      </SectionLabel>
      <View style={styles.grid}>
        <View style={styles.big}><Tile uri={photos[0]} index={0} label={label(0)} onPress={onPhotoPress} /></View>
        {photos.length > 1 ? (
          <View style={styles.small}>
            <Tile uri={photos[1]} index={1} label={label(1)} onPress={onPhotoPress} />
            {photos.length > 2 ? (
              <Tile uri={photos[2]} index={2} label={label(2)} onPress={onPhotoPress}>
                {extra > 0 ? <View style={styles.more}><Text style={styles.moreText}>+{extra}</Text></View> : null}
              </Tile>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: DesignSpacing.lg },
  seeAll: { fontFamily, fontSize: 13, fontWeight: '700', color: DesignColors.primaryFixed },
  grid: { flexDirection: 'row', gap: DesignSpacing.sm, height: GRID_HEIGHT },
  big: { flex: 5 },
  small: { flex: 4, gap: DesignSpacing.sm },
  tile: { flex: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: DesignColors.surfaceContainerHigh },
  more: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.scrimHeavy, borderRadius: DesignRadius.lg },
  moreText: { fontFamily, fontSize: 20, fontWeight: '800', color: DesignColors.onSurface },
});
