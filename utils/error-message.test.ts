import { getErrorMessage } from './error-message';

describe('getErrorMessage', () => {
  it('reads Error and Supabase-style messages', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
    expect(getErrorMessage({ message: 'row violates policy' })).toBe('row violates policy');
  });

  it('falls back to error_description, then the fallback', () => {
    expect(getErrorMessage({ error_description: 'bad token' })).toBe('bad token');
    expect(getErrorMessage(null, 'nope')).toBe('nope');
    expect(getErrorMessage({ message: '  ' })).toBe('Something went wrong. Please try again.');
  });

  it('accepts plain strings', () => {
    expect(getErrorMessage('offline')).toBe('offline');
  });
});
