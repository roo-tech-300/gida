import { formatNaira } from './format-naira';
import { memberEqualAmount } from './liquidity-pricing';

describe('memberEqualAmount', () => {
  it('charges every pod member the identical whole-naira share', () => {
    expect(memberEqualAmount(450000, 2)).toBe(225000);
  });

  it('keeps kobo precision so odd splits stay identical', () => {
    expect(memberEqualAmount(1000000, 3)).toBe(333333.33);
  });

  it('returns 0 for invalid inputs', () => {
    expect(memberEqualAmount(450000, 0)).toBe(0);
    expect(memberEqualAmount(-100, 2)).toBe(0);
    expect(memberEqualAmount(Number.NaN, 2)).toBe(0);
  });
});

describe('formatNaira', () => {
  it('renders whole naira with no decimals', () => {
    expect(formatNaira(225000)).toBe('₦225,000');
    expect(formatNaira(450000)).toBe('₦450,000');
  });

  it('renders fractional naira with exactly two decimals', () => {
    expect(formatNaira(333333.33)).toBe('₦333,333.33');
    expect(formatNaira(231.45)).toBe('₦231.45');
  });

  it('renders non-finite input as zero', () => {
    expect(formatNaira(Number.NaN)).toBe('₦0');
  });
});