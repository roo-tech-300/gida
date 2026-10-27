import { getPlaceCategoryMeta, PLACE_CATEGORY_MAP } from '@/constants/place-categories';

describe('getPlaceCategoryMeta', () => {
  it('resolves categories that exist in the DB but not in the legacy static list', () => {
    const school = getPlaceCategoryMeta('school');

    expect(school.label).toBe('School Buildings');
    expect(school.icon).toBe('school-outline');
  });

  it.each(['school', 'recreation', 'church', 'mosque', 'work'])(
    'renders a full meta record for the DB category %s',
    (key) => {
      const meta = getPlaceCategoryMeta(key);

      expect(meta.key).toBe(key);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(meta.accent.length).toBeGreaterThan(0);
    },
  );

  it('humanizes unknown keys instead of returning undefined', () => {
    const meta = getPlaceCategoryMeta('recreation_center');

    expect(meta.label).toBe('Recreation Center');
    expect(meta.icon).toBe('grid-outline');
  });

  it.each([null, undefined, '', '   '])('falls back safely for %p', (key) => {
    const meta = getPlaceCategoryMeta(key);

    expect(meta.label).toBe('Uncategorized');
    expect(meta.key).toBe('uncategorized');
    expect(PLACE_CATEGORY_MAP[meta.key]).toBeUndefined();
  });
});
