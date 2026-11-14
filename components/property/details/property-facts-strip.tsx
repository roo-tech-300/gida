import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import type { FeedListing } from '@/types/feed-listing';

/** Bedrooms, bathrooms, size and floor in one strip. Facts the listing doesn't have are left out. */
export function PropertyFactsStrip({ property }: { property: FeedListing }) {
  const facts = [
    { label: 'BEDROOMS', value: property.beds },
    { label: 'BATHROOMS', value: property.baths },
    { label: 'INTERIOR', value: property.size },
    { label: 'FLOOR', value: property.floor },
  ].filter((fact) => Boolean(fact.value));

  if (facts.length === 0) return null;

  return (
    <View style={styles.strip}>
      {facts.map((fact, i) => (
        <View key={fact.label} style={[styles.fact, i > 0 && styles.divider]}>
          <Text style={[styles.value, facts.length > 3 && styles.valueCompact]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{fact.value}</Text>
          <Text style={styles.label}>{fact.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    paddingVertical: DesignSpacing.md,
    marginBottom: DesignSpacing.lg,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  fact: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  divider: { borderLeftWidth: 1, borderLeftColor: DesignColors.borderSoft },
  value: { fontFamily, fontSize: 18, fontWeight: '800', color: DesignColors.onSurface },
  valueCompact: { fontSize: 15 },
  label: { fontFamily, fontSize: 10, fontWeight: '700', letterSpacing: 1, color: DesignColors.outline },
});
