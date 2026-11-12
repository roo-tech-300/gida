import { canSubmitDecline, composeDeclineReason } from './decline-reasons';

describe('decline reasons', () => {
  it('writes the chip sentence and appends the admin note', () => {
    expect(composeDeclineReason('full', 'Try Prime Lodge next door.')).toBe('This household is already full. Try Prime Lodge next door.');
    expect(composeDeclineReason('full', '  ')).toBe('This household is already full.');
  });
  it('always ends the note with a full stop so the message reads cleanly', () => {
    expect(composeDeclineReason('full', 'Try Prime Lodge next door, 2 spots open')).toBe('This household is already full. Try Prime Lodge next door, 2 spots open.');
    expect(composeDeclineReason('other', 'Landlord withdrew the listing')).toBe('Landlord withdrew the listing.');
  });
  it('needs a reason, and a note when the reason is Other', () => {
    expect(canSubmitDecline(null, 'hello')).toBe(false);
    expect(canSubmitDecline('other', '')).toBe(false);
    expect(canSubmitDecline('other', 'Landlord withdrew the listing.')).toBe(true);
    expect(canSubmitDecline('full', '')).toBe(true);
  });
});
