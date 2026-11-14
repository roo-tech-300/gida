import { rentSplitUnit, roundUpRent } from './round-up-rent';

describe('rentSplitUnit', () => {
  it('is the smallest number every household size from 1 to N divides', () => {
    expect([1, 2, 3, 4, 5, 6].map(rentSplitUnit)).toEqual([1, 2, 6, 12, 60, 60]);
  });

  it('stays within the supported range', () => {
    expect(rentSplitUnit(0)).toBe(1);
    expect(rentSplitUnit(99)).toBe(rentSplitUnit(10));
  });
});

describe('roundUpRent', () => {
  it('raises an uneven rent to the next amount every household size splits into whole naira', () => {
    expect(roundUpRent(1_000_000, 3)).toBe(1_000_002);
    expect(roundUpRent(1_000_000, 4)).toBe(1_000_008);
    expect(roundUpRent(1_000_000, 4) / 3).toBe(333_336);
  });

  it('never lowers a rent and leaves an even one alone', () => {
    expect(roundUpRent(1_200_000, 4)).toBe(1_200_000);
    expect(roundUpRent(250_001, 1)).toBe(250_001);
    for (const price of [90_001, 123_457, 999_999]) {
      for (const people of [1, 2, 3, 4, 5, 6]) expect(roundUpRent(price, people)).toBeGreaterThanOrEqual(price);
    }
  });

  it('ignores prices that are empty or not numbers', () => {
    expect(roundUpRent(0, 4)).toBe(0);
    expect(roundUpRent(Number.NaN, 4)).toBeNaN();
  });
});
