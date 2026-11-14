import { extraFeatures, includedAmenities } from './included-amenities';

describe('includedAmenities', () => {
  it('lists only the switches that are on, in display order', () => {
    const listing = { has_generator: true, has_borehole: true, has_internet: false, is_shared_kitchen: true } as never;
    expect(includedAmenities(listing).map((a) => a.label)).toEqual(['Borehole', 'Generator', 'Shared kitchen']);
  });

  it('is empty without a listing', () => {
    expect(includedAmenities(undefined)).toEqual([]);
  });
});

describe('extraFeatures', () => {
  const chips = [{ key: 'has_borehole', label: 'Borehole' }, { key: 'has_generator', label: 'Generator' }];

  it('drops features a chip already covers and keeps the rest', () => {
    expect(extraFeatures(['Solar backup', 'Borehole Water', 'Keke stop at the gate'], chips)).toEqual(['Solar backup', 'Keke stop at the gate']);
  });

  it('keeps everything when there are no chips', () => {
    expect(extraFeatures(['Solar backup'], [])).toEqual(['Solar backup']);
  });
});
