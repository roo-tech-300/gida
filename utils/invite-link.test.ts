import { buildInviteUrl, inviteMessage, isValidInviteToken } from './invite-link';

const TOKEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

describe('invite links', () => {
  it('accepts only 32 lowercase hex characters', () => {
    expect(isValidInviteToken(TOKEN)).toBe(true);
    for (const bad of ['', 'short', TOKEN.toUpperCase(), `${TOKEN}0`, 'g'.repeat(32), undefined, null]) {
      expect(isValidInviteToken(bad as string)).toBe(false);
    }
  });

  it('builds the join URL on the given origin, tolerating a trailing slash', () => {
    expect(buildInviteUrl('https://example.test/', TOKEN)).toBe(`https://example.test/join/${TOKEN}`);
    expect(buildInviteUrl('http://localhost:8081', TOKEN)).toBe(`http://localhost:8081/join/${TOKEN}`);
  });

  it('falls back to the production site when no origin is configured', () => {
    expect(buildInviteUrl(undefined, TOKEN)).toBe(`https://gida.apartments/join/${TOKEN}`);
    expect(buildInviteUrl('  ', TOKEN)).toBe(`https://gida.apartments/join/${TOKEN}`);
  });

  it('writes a message that names the place and carries the link', () => {
    const text = inviteMessage('Royal Lodge', 'https://x.test/join/abc', 'Ada');
    expect(text).toContain('Ada here.');
    expect(text).toContain('Royal Lodge');
    expect(text).toContain('https://x.test/join/abc');
    expect(inviteMessage('Royal Lodge', 'https://x.test', null)).not.toContain('here.');
  });
});
