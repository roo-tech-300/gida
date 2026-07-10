export type TourAgent = {
  name: string;
  initials: string;
  rating: number;
  verified: boolean;
  image: number;
};

export const TOUR_AGENT: TourAgent = {
  name: 'Sarah Jenkins',
  initials: 'SJ',
  rating: 4.9,
  verified: true,
  image: require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.png'),
};

export const TIME_SLOTS = [
  '10:00 AM',
  '11:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getDatePills(daysAhead = 7) {
  const today = new Date();
  const pills: { dayName: string; dayNumber: number; date: Date }[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    pills.push({ dayName: DAY_NAMES[d.getDay()], dayNumber: d.getDate(), date: d });
  }
  return pills;
}
