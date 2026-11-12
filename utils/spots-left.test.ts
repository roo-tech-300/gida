import { parseSpotsLeft, spotsLeftLabel } from './spots-left';

describe('spotsLeftLabel', () => {
  it('speaks up only when spots are scarce', () => {
    expect(spotsLeftLabel(0)).toBe('Full');
    expect(spotsLeftLabel(1)).toBe('1 spot left');
    expect(spotsLeftLabel(3)).toBe('3 spots left');
    expect(spotsLeftLabel(4)).toBeNull();
    expect(spotsLeftLabel(undefined)).toBeNull();
  });
});

describe('parseSpotsLeft', () => {
  it('keeps only valid counts', () => {
    expect(parseSpotsLeft({ a: 2, b: -1, c: 'x', d: 1.9 })).toEqual({ a: 2, d: 1 });
    expect(parseSpotsLeft(null)).toEqual({});
    expect(parseSpotsLeft([1, 2])).toEqual({});
  });
});
