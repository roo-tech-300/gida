import type { DbListing } from '@/types/feed-listing';

export type IncludedAmenity = { key: string; label: string };

const TOGGLES: { key: keyof DbListing; label: string }[] = [
  { key: 'has_borehole', label: 'Borehole' },
  { key: 'has_generator', label: 'Generator' },
  { key: 'has_internet', label: 'Internet' },
  { key: 'has_fenced_gate', label: 'Fenced gate' },
  { key: 'has_burglary', label: 'Burglary proof' },
  { key: 'has_cabinet', label: 'Cabinet' },
  { key: 'has_wardrobe', label: 'Wardrobe' },
  { key: 'is_shared_bathroom', label: 'Shared bath' },
  { key: 'is_shared_kitchen', label: 'Shared kitchen' },
];

/** The amenity switches a listing has turned on, in display order. */
export function includedAmenities(listing: DbListing | undefined): IncludedAmenity[] {
  if (!listing) return [];
  return TOGGLES.filter(({ key }) => Boolean(listing[key])).map(({ key, label }) => ({ key: String(key), label }));
}

/** Custom features that the chips don't already say, e.g. "Borehole Water" is dropped when "Borehole" is shown. */
export function extraFeatures(features: readonly string[], chips: readonly IncludedAmenity[]): string[] {
  const chipWords = chips.map((chip) => chip.label.toLowerCase());
  return features.filter((feature) => {
    const text = feature.toLowerCase();
    return !chipWords.some((word) => text.includes(word) || word.includes(text));
  });
}
