import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import type { FeedListing } from '@/types/feed-listing';
import { formatNaira } from '@/utils/format-naira';

/** The student's share of the rent, big, with the whole-place price beside it for shared lodges. */
export function PropertyPriceCard({ property }: { property: FeedListing }) {
  const isShared = (property.propertyTier ?? 1) > 1;

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.price}>{formatNaira(property.pricePerPerson)}</Text>
        <Text style={styles.note}>{isShared ? 'per person · per year' : 'per year'}</Text>
      </View>
      {isShared ? (
        <View style={styles.whole}>
          <Text style={styles.wholeLabel}>Whole place</Text>
          <Text style={styles.wholePrice}>{formatNaira(property.priceAmount)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignSpacing.md + 4,
    marginBottom: DesignSpacing.md,
    borderRadius: DesignRadius.xl - 6,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  price: { fontFamily, fontSize: 30, fontWeight: '800', letterSpacing: -0.5, color: DesignColors.primaryFixed },
  note: { fontFamily, fontSize: 13, color: DesignColors.onSurfaceVariant },
  whole: { alignItems: 'flex-end', gap: 2 },
  wholeLabel: { fontFamily, fontSize: 11, fontWeight: '600', color: DesignColors.outline },
  wholePrice: { fontFamily, fontSize: 15, fontWeight: '700', color: DesignColors.onSurface },
});
