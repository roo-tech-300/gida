export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  avatar: string;
};

export const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    author: 'Amina Bello',
    rating: 5,
    date: '2026-06-12',
    text: 'Amazing place! The landlord is super responsive and the location is perfect for campus. Would definitely recommend.',
    avatar: 'https://i.pravatar.cc/100?img=1',
  },
  {
    id: '2',
    author: 'Yusuf Abdullahi',
    rating: 4,
    date: '2026-05-28',
    text: 'Great value for the price. The borehole water and generator were lifesavers during exams. Only downside is the shared kitchen can get busy.',
    avatar: 'https://i.pravatar.cc/100?img=3',
  },
  {
    id: '3',
    author: 'Chidinma Okafor',
    rating: 5,
    date: '2026-04-10',
    text: 'Lived here for two semesters. The internet is solid, the place is always clean, and the fenced gate made me feel safe. 10/10.',
    avatar: 'https://i.pravatar.cc/100?img=5',
  },
  {
    id: '4',
    author: 'Ibrahim Suleiman',
    rating: 3,
    date: '2026-03-15',
    text: 'Decent room but the bathroom is shared which can be annoying early in the morning. Location is good though.',
    avatar: 'https://i.pravatar.cc/100?img=8',
  },
];
