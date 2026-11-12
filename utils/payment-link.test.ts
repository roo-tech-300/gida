import { buildPayUrl, buildShareMessage, firstName, isValidEmail, isValidPayToken } from '@/utils/payment-link';

describe('isValidPayToken', () => {
  it('accepts 32 lowercase hex characters only', () => {
    expect(isValidPayToken('29e9e4de27194f7faeb1ec12864f747d')).toBe(true);
    expect(isValidPayToken('29E9E4DE27194F7FAEB1EC12864F747D')).toBe(false);
    expect(isValidPayToken('short')).toBe(false);
    expect(isValidPayToken(undefined)).toBe(false);
  });
});

describe('buildPayUrl', () => {
  it('uses the given origin without a trailing slash', () => {
    expect(buildPayUrl('http://localhost:8081/', 'abc')).toBe('http://localhost:8081/pay/abc');
  });
  it('falls back to the production domain', () => {
    expect(buildPayUrl('', 'abc')).toBe('https://gida.apartments/pay/abc');
    expect(buildPayUrl(undefined, 'abc')).toBe('https://gida.apartments/pay/abc');
  });
});

describe('firstName', () => {
  it('returns the first word and tolerates empty input', () => {
    expect(firstName('Ada Okafor')).toBe('Ada');
    expect(firstName('  ')).toBe('');
    expect(firstName(null)).toBe('');
  });
});

describe('buildShareMessage', () => {
  it('names the student, place, amount and link', () => {
    const text = buildShareMessage({ studentName: 'Ada', amountLabel: '₦250,000', placeTitle: 'Royal Lodge', url: 'https://x/pay/t' });
    expect(text).toBe('Ada has reserved a spot at Royal Lodge on Gida. You can pay ₦250,000 securely here: https://x/pay/t');
  });
  it('degrades gracefully when the name or place is missing', () => {
    const text = buildShareMessage({ studentName: '', amountLabel: '₦1', placeTitle: null, url: 'u' });
    expect(text).toBe('Your child has reserved a spot on Gida. You can pay ₦1 securely here: u');
  });
});

describe('isValidEmail', () => {
  it('accepts normal addresses and rejects obvious typos', () => {
    expect(isValidEmail('mum@example.com')).toBe(true);
    expect(isValidEmail(' mum@example.com ')).toBe(true);
    expect(isValidEmail('mum@example')).toBe(false);
    expect(isValidEmail('mum example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});
