import { DAY_NAMES, TIME_SLOTS } from '@/dummy/tour-scheduler-mock';
import type { TourAvailabilityEntry } from '@/services/tour-booking-service';

export const TOUR_CAPACITY = 4;

const FRIDAY = 5;
const PRAYER_SLOTS = new Set(['01:00 PM', '02:30 PM']);

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type DatePill = {
  dayName: string;
  dayNumber: number;
  date: Date;
};

export function formatTourDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${MONTHS_SHORT[month - 1]} ${day}, ${year}`;
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function slotsForDate(date: Date, availability: TourAvailabilityEntry[]): string[] {
  return allSlotsForDate(date, availability)
    .filter((slot) => slot.available)
    .map((slot) => slot.time);
}

export type SlotOption = {
  time: string;
  available: boolean;
};

export function allSlotsForDate(date: Date, availability: TourAvailabilityEntry[]): SlotOption[] {
  const key = dateKey(date);
  const entryBySlot = new Map(
    availability.filter((entry) => entry.date === key).map((entry) => [entry.time, entry]),
  );
  return TIME_SLOTS.map((time) => {
    if (date.getDay() === FRIDAY && PRAYER_SLOTS.has(time)) {
      return { time, available: false };
    }
    const entry = entryBySlot.get(time);
    const available = !entry?.adminUnavailable && (entry?.booked ?? 0) < TOUR_CAPACITY;
    return { time, available };
  });
}

export function isDateBookedOut(date: Date, availability: TourAvailabilityEntry[]): boolean {
  return slotsForDate(date, availability).length === 0;
}

export function buildDatePills(
  availability: TourAvailabilityEntry[],
  daysAhead = 7,
  from = new Date(),
): DatePill[] {
  const pills: DatePill[] = [];
  let offset = 0;
  while (pills.length < daysAhead && offset < 120) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + offset);
    offset += 1;
    if (candidate.getDay() === 0) {
      continue;
    }
    if (isDateBookedOut(candidate, availability)) {
      continue;
    }
    pills.push({ dayName: DAY_NAMES[candidate.getDay()], dayNumber: candidate.getDate(), date: candidate });
  }
  return pills;
}
