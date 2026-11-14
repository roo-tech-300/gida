import { isAllowedRedirect } from './pending-redirect';

const TOKEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

describe('isAllowedRedirect', () => {
  it('allows only invite links', () => {
    expect(isAllowedRedirect(`/join/${TOKEN}`)).toBe(true);
    expect(isAllowedRedirect(`/join/${TOKEN}/`)).toBe(true);
  });

  it('refuses everything else, including look-alikes and other sites', () => {
    for (const bad of ['/', '/(tabs)', '/property/abc', '//evil.test/join/' + TOKEN, 'https://evil.test/join/' + TOKEN, `/join/${TOKEN}?next=//evil.test`, '/join/short', null, undefined, '']) {
      expect(isAllowedRedirect(bad)).toBe(false);
    }
  });
});
