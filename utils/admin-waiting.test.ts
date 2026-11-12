import { waitingSince } from './admin-waiting';

const NOW = new Date('2026-11-11T12:00:00.000Z').getTime();
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

describe('waitingSince', () => {
  it('is green and brief under an hour', () => {
    expect(waitingSince(ago(12), NOW)).toEqual({ label: '12m', tone: 'ok' });
    expect(waitingSince(ago(0), NOW)).toEqual({ label: 'Just now', tone: 'ok' });
  });
  it('turns amber from one hour and red from four', () => {
    expect(waitingSince(ago(65), NOW)).toEqual({ label: '1h 5m', tone: 'warn' });
    expect(waitingSince(ago(220), NOW)).toEqual({ label: '3h 40m', tone: 'warn' });
    expect(waitingSince(ago(240), NOW).tone).toBe('late');
  });
  it('switches to days for long waits and never goes negative', () => {
    expect(waitingSince(ago(26 * 60), NOW)).toEqual({ label: '1d 2h', tone: 'late' });
    expect(waitingSince(ago(-30), NOW).label).toBe('Just now');
  });
});
