import { randomPassword, usernameFromEmail, validateGuestDetails, validateNewPassword } from './guest-details';

const good = { name: 'Kemi Danjuma', email: 'kemi@example.com', gender: 'FEMALE' as const, school: 'FUT Minna' };

describe('validateGuestDetails', () => {
  it('accepts complete details', () => {
    expect(validateGuestDetails(good)).toEqual({});
  });

  it('asks for each missing piece in plain words', () => {
    const errors = validateGuestDetails({ name: 'Kemi', email: 'not-an-email', gender: null, school: '' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'gender', 'name', 'school']);
    expect(errors.name).toMatch(/first and last name/);
  });

  it('trims whitespace before judging', () => {
    expect(validateGuestDetails({ ...good, name: '  Kemi   Danjuma ', email: ' kemi@example.com ' })).toEqual({});
  });
});

describe('randomPassword', () => {
  it('is long, varied and different each time', () => {
    const a = randomPassword();
    expect(a).toHaveLength(24);
    expect(new Set(a).size).toBeGreaterThan(8);
    expect(randomPassword()).not.toBe(a);
  });
});

describe('usernameFromEmail', () => {
  it('turns the part before the @ into a safe username with a numeric suffix', () => {
    expect(usernameFromEmail('Kemi.Danjuma@x.com', 482)).toBe('kemi_danjuma482');
    expect(usernameFromEmail('a+b@x.com', 7)).toBe('a_b7');
    expect(usernameFromEmail('@x.com', 1)).toBe('student1');
  });
});

describe('validateNewPassword', () => {
  it('needs at least 8 characters and a matching confirmation', () => {
    expect(validateNewPassword('short', 'short')).toMatch(/at least 8/);
    expect(validateNewPassword('longenough', 'different1')).toMatch(/do not match/);
    expect(validateNewPassword('longenough', 'longenough')).toBeNull();
  });
});
