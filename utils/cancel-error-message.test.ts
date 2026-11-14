import { cancelErrorMessage } from './cancel-error-message';

describe('cancelErrorMessage', () => {
  it('explains a paid reservation and points to Support', () => {
    expect(cancelErrorMessage(new Error('ALREADY_PAID'))).toMatch(/already been paid.*Support/);
  });

  it('asks the student to wait while a payment is going through', () => {
    expect(cancelErrorMessage(new Error('A payment for this reservation is still processing. Please wait a few minutes.'))).toMatch(/still going through/);
  });

  it('handles plain Supabase error objects', () => {
    expect(cancelErrorMessage({ message: 'RESERVATION_NOT_FOUND' })).toBe('We could not find that reservation.');
    expect(cancelErrorMessage({ message: 'NOT_SIGNED_IN' })).toMatch(/sign in/);
  });

  it('falls back to a generic retry message', () => {
    expect(cancelErrorMessage(new Error('boom'))).toBe('We could not cancel your request. Please try again.');
    expect(cancelErrorMessage(undefined)).toBe('We could not cancel your request. Please try again.');
  });
});
