import type { TourAvailabilityEntry } from '@/services/tour-booking-service';
import { TOUR_CAPACITY, allSlotsForDate, buildDatePills, dateKey, slotsForDate } from './tour-availability';

function at(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function fullDay(iso: string): TourAvailabilityEntry[] {
  return ['10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'].map((time) => ({
    date: iso,
    time,
    booked: TOUR_CAPACITY,
    adminUnavailable: false,
  }));
}

describe('slotsForDate', () => {
  it('returns every slot when there is no availability', () => {
    const slots = slotsForDate(at('2026-08-17'), []);
    expect(slots).toEqual(['10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM']);
  });

  it('drops slots that reached capacity', () => {
    const availability: TourAvailabilityEntry[] = [
      { date: '2026-08-17', time: '10:00 AM', booked: 4, adminUnavailable: false },
      { date: '2026-08-17', time: '04:00 PM', booked: 3, adminUnavailable: false },
    ];
    const slots = slotsForDate(at('2026-08-17'), availability);
    expect(slots).not.toContain('10:00 AM');
    expect(slots).toContain('04:00 PM');
  });

  it('removes Friday prayer slots (1:00 PM and 2:30 PM)', () => {
    const friday = at('2026-08-21');
    expect(friday.getDay()).toBe(5);
    const slots = slotsForDate(friday, []);
    expect(slots).toEqual(['10:00 AM', '11:30 AM', '04:00 PM', '05:30 PM']);
  });

  it('drops slots where the admin is unavailable on another listing', () => {
    const availability: TourAvailabilityEntry[] = [
      { date: '2026-08-17', time: '10:00 AM', booked: 1, adminUnavailable: true },
      { date: '2026-08-17', time: '04:00 PM', booked: 1, adminUnavailable: false },
    ];
    const slots = slotsForDate(at('2026-08-17'), availability);
    expect(slots).not.toContain('10:00 AM');
    expect(slots).toContain('04:00 PM');
  });

  it('keeps prayer slots on other days', () => {
    const slots = slotsForDate(at('2026-08-18'), []);
    expect(slots).toContain('01:00 PM');
    expect(slots).toContain('02:30 PM');
  });
});

describe('allSlotsForDate', () => {
  it('returns every slot with availability flags', () => {
    const availability: TourAvailabilityEntry[] = [
      { date: '2026-08-17', time: '10:00 AM', booked: 4, adminUnavailable: false },
      { date: '2026-08-17', time: '11:30 AM', booked: 1, adminUnavailable: true },
    ];
    const all = allSlotsForDate(at('2026-08-17'), availability);
    expect(all).toHaveLength(6);

    const capFull = all.find((s) => s.time === '10:00 AM');
    const adminBusy = all.find((s) => s.time === '11:30 AM');
    const free = all.find((s) => s.time === '04:00 PM');

    expect(capFull?.available).toBe(false);
    expect(adminBusy?.available).toBe(false);
    expect(free?.available).toBe(true);
  });

  it('marks Friday prayer slots unavailable but keeps them visible', () => {
    const all = allSlotsForDate(at('2026-08-21'), []);
    expect(all.find((s) => s.time === '01:00 PM')?.available).toBe(false);
    expect(all.find((s) => s.time === '02:30 PM')?.available).toBe(false);
    expect(all.find((s) => s.time === '10:00 AM')?.available).toBe(true);
    expect(all).toHaveLength(6);
  });
});

describe('buildDatePills', () => {
  it('skips Sundays', () => {
    const from = at('2026-08-15');
    expect(from.getDay()).toBe(6);
    const pills = buildDatePills([], 2, from);
    expect(pills.map((p) => dateKey(p.date))).toEqual(['2026-08-15', '2026-08-17']);
  });

  it('skips fully-booked days and extends the window', () => {
    const from = at('2026-08-17');
    const availability = fullDay('2026-08-17').concat(fullDay('2026-08-18'));
    const pills = buildDatePills(availability, 2, from);
    const keys = pills.map((p) => dateKey(p.date));
    expect(keys).not.toContain('2026-08-17');
    expect(keys).not.toContain('2026-08-18');
    expect(pills).toHaveLength(2);
  });

  it('returns at most daysAhead bookable days', () => {
    const pills = buildDatePills([], 7, at('2026-08-17'));
    expect(pills).toHaveLength(7);
  });
});

describe('dateKey', () => {
  it('formats padded month and day', () => {
    expect(dateKey(at('2026-01-05'))).toBe('2026-01-05');
    expect(dateKey(at('2026-12-31'))).toBe('2026-12-31');
  });
});
