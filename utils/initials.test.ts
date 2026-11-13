import { getInitials } from './initials';

describe('getInitials', () => {
  it('uses the first and last name', () => {
    expect(getInitials('Amina Bello')).toBe('AB');
    expect(getInitials('  Abdul  Rahman Musa ')).toBe('AM');
  });

  it('uses the first two letters of a single name', () => {
    expect(getInitials('Zainab')).toBe('ZA');
  });

  it('falls back to S when there is no name', () => {
    expect(getInitials('')).toBe('S');
    expect(getInitials(null)).toBe('S');
    expect(getInitials(undefined)).toBe('S');
  });
});
