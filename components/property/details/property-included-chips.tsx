import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import type { IncludedAmenity } from '@/utils/included-amenities';
import { SectionLabel } from './section-label';

/** One scrolling row of what the place comes with. */
export function PropertyIncludedChips({ amenities }: { amenities: IncludedAmenity[] }) {
  if (amenities.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionLabel>{"WHAT'S INCLUDED"}</SectionLabel>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {amenities.map((item) => (
            <View key={item.key} style={styles.chip}>
              <View style={styles.dot} />
              <Text style={styles.text}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>
        <LinearGradient
          colors={['rgba(19,19,21,0)', DesignColors.surface]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fade}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: DesignSpacing.lg },
  row: { gap: DesignSpacing.sm, paddingRight: DesignSpacing.xl },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: DesignColors.primaryBright },
  text: { fontFamily, fontSize: 13, fontWeight: '600', color: DesignColors.onSurface },
  fade: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 36 },
});
