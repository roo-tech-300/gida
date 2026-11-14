import { layoutLabel } from './layout-label';

describe('layoutLabel', () => {
  it('names the known layouts', () => {
    expect(layoutLabel('self_contain')).toBe('Self-contain');
    expect(layoutLabel('flat')).toBe('Flat');
  });

  it('title-cases unknown layouts and hides missing ones', () => {
    expect(layoutLabel('duplex_unit')).toBe('Duplex unit');
    expect(layoutLabel(null)).toBe('');
  });
});
