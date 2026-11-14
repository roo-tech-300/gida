import { setPendingRedirect, takePendingRedirect } from './pending-redirect';

const TOKEN = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

describe('pending redirect', () => {
  it('hands back a remembered invite link exactly once', () => {
    setPendingRedirect(`/join/${TOKEN}`);
    expect(takePendingRedirect()).toBe(`/join/${TOKEN}`);
    expect(takePendingRedirect()).toBeNull();
  });

  it('never remembers a link that is not an invite', () => {
    setPendingRedirect('/property/123');
    setPendingRedirect('https://evil.test');
    expect(takePendingRedirect()).toBeNull();
  });

  it('keeps only the most recent link', () => {
    setPendingRedirect(`/join/${TOKEN}`);
    setPendingRedirect(`/join/${'b'.repeat(32)}`);
    expect(takePendingRedirect()).toBe(`/join/${'b'.repeat(32)}`);
  });
});
