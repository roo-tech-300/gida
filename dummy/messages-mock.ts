export type MessageSender = 'me' | 'them';

export type MessageItem = {
  id: string;
  sender: MessageSender;
  text: string;
  time: string;
};

export type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  initials: string;
  image: number;
  verified: boolean;
};

export type TourInfo = {
  propertyName: string;
  unit: string;
  date: string;
  time: string;
  image: number;
};

export type Match = {
  id: string;
  name: string;
  initials: string;
  verified: boolean;
};

export const chatMessages: Record<string, MessageItem[]> = {
  'sarah-jenkins': [
    { id: 'sj-1', sender: 'them', text: 'Hey! I saw you liked the 4-bedroom at Zenith Terraces.', time: '4:10 PM' },
    { id: 'sj-2', sender: 'me', text: 'Yeah, the balcony view is incredible. Is it still available for a tour tomorrow?', time: '4:12 PM' },
    { id: 'sj-3', sender: 'them', text: 'Absolutely. I have a slot at 2 PM or 4 PM. Which works best for you?', time: '4:13 PM' },
    { id: 'sj-4', sender: 'me', text: '2 PM works perfectly for me!', time: '4:14 PM' },
    { id: 'sj-5', sender: 'them', text: 'Perfect! I will confirm the viewing and send you the details.', time: '4:15 PM' },
  ],
};

export const conversationTours: Partial<Record<string, TourInfo>> = {
  'sarah-jenkins': { propertyName: 'Zenith Terraces', unit: 'Unit 4B', date: 'Tomorrow', time: '2:00 PM', image: require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.png') },
};

export const matches: Match[] = [
  { id: 'sarah-j', name: 'Sarah J.', initials: 'SJ', verified: true },
  { id: 'liam-w', name: 'Liam W.', initials: 'LW', verified: false },
  { id: 'sofia-k', name: 'Sofia K.', initials: 'SK', verified: true },
  { id: 'marcus-t', name: 'Marcus T.', initials: 'MT', verified: false },
  { id: 'elena-r', name: 'Elena R.', initials: 'ER', verified: false },
];

export const conversations: Conversation[] = [
  {
    id: 'sarah-jenkins',
    name: 'Sarah Jenkins',
    lastMessage: 'I checked out the Kensington flat, it looks perfect!',
    time: '2m',
    unreadCount: 1,
    initials: 'SJ',
    image: require('@/dummy/images/houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.png'),
    verified: true,
  },
  {
    id: 'liam-williams',
    name: 'Liam Williams',
    lastMessage: 'Are you free to chat about the utility split?',
    time: '15m',
    unreadCount: 0,
    initials: 'LW',
    image: require('@/dummy/images/houses/Gemini_Generated_Image_1miazv1miazv1mia.png'),
    verified: false,
  },
  {
    id: 'sofia-kuznetsova',
    name: 'Sofia Kuznetsova',
    lastMessage: 'That room in Chelsea is still available. Do you want to see it?',
    time: '1h',
    unreadCount: 0,
    initials: 'SK',
    image: require('@/dummy/images/houses/Gemini_Generated_Image_5d7v1i5d7v1i5d7v.png'),
    verified: true,
  },
  {
    id: 'highstreet-lettings',
    name: 'HighStreet Lettings',
    lastMessage: 'Your viewing for 24b Park Lane is confirmed for tomorrow.',
    time: '3h',
    unreadCount: 0,
    initials: 'HL',
    image: require('@/dummy/images/houses/Gemini_Generated_Image_5j0rak5j0rak5j0r.png'),
    verified: false,
  },
  {
    id: 'marcus-thompson',
    name: 'Marcus Thompson',
    lastMessage: "Great meeting you yesterday! Let's touch base soon.",
    time: 'Yesterday',
    unreadCount: 0,
    initials: 'MT',
    image: require('@/dummy/images/houses/Gemini_Generated_Image_1wlh0m1wlh0m1wlh.png'),
    verified: false,
  },
];
