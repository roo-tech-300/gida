import type { AppTourStep } from '@/types/app-tour';

export const APP_TOUR_STEPS: AppTourStep[] = [
  {
    id: 'search',
    stepNumber: 1,
    badge: 'Home & Discovery',
    title: 'Find Verified Student Lodges',
    subtitle: 'Search high-quality apartments around your university campus with verified student amenities.',
    bullets: [
      { icon: 'search-outline', text: 'Search by campus zone, estate name, or landmark' },
      { icon: 'options-outline', text: 'Filter by rent budget, self-contained, or flat layouts' },
      { icon: 'shield-checkmark-outline', text: 'Only vetted lodges inspected by student field admins' },
    ],
  },
  {
    id: 'switch-views',
    stepNumber: 2,
    badge: 'Dual Feeds',
    title: 'Switch Between Lodges & Roommates',
    subtitle: 'Gida lets you find a space and compatible housemates in a single app.',
    bullets: [
      { icon: 'swap-vertical-outline', text: 'Swipe down on the home search bar to switch modes' },
      { icon: 'business-outline', text: 'Find a Space mode displays available rooms & apartments' },
      { icon: 'people-outline', text: 'Find a Peer mode matches you with verified students' },
    ],
  },
  {
    id: 'tours',
    stepNumber: 3,
    badge: 'Inspection Tours',
    title: 'Assisted & Self-Guided Tours',
    subtitle: 'Visit before you pay. Choose the inspection style that works best for your schedule.',
    bullets: [
      { icon: 'calendar-outline', text: 'Assisted Tour: Book an in-person walkthrough with a campus admin' },
      { icon: 'navigate-circle-outline', text: 'Non-Assisted: Pay a micro-fee for instant GPS directions' },
      { icon: 'qr-code-outline', text: 'Digital Tour Pass with secure verification for peace of mind' },
    ],
  },
  {
    id: 'booking',
    stepNumber: 4,
    badge: 'Room Reservation',
    title: 'Reserve Solo or in a Roommate Pod',
    subtitle: 'Secure rooms safely without middleman fees or risky offline payments.',
    bullets: [
      { icon: 'person-outline', text: 'Solo Booking: Secure single-occupancy rooms directly' },
      { icon: 'people-circle-outline', text: 'Roommate Pods: Split rent with friends or matched students' },
      { icon: 'wallet-outline', text: 'Integrated Paystack checkout with transparent slot pricing' },
    ],
  },
  {
    id: 'messages',
    stepNumber: 5,
    badge: 'Real-Time Messaging',
    title: 'Chat & Coordinate With Roommates',
    subtitle: 'Connect directly with prospective roommates before committing to a lease.',
    bullets: [
      { icon: 'chatbubbles-outline', text: 'Instant chats with prospective peers' },
      { icon: 'share-social-outline', text: 'Share lodge preview cards directly into conversations' },
      { icon: 'mail-unread-outline', text: 'Receive and accept group pod invitations in your thread' },
    ],
  },
  {
    id: 'saved',
    stepNumber: 6,
    badge: 'Favorites & Watchlist',
    title: 'Save & Compare Your Top Choices',
    subtitle: 'Keep all your prospective apartments organized in one dedicated space.',
    bullets: [
      { icon: 'heart-outline', text: 'Tap the heart icon on any lodge card to save it' },
      { icon: 'grid-outline', text: 'Access your saved list anytime from the bottom navigation' },
      { icon: 'sparkles-outline', text: 'Easily compare pricing, proximity to campus, and facilities' },
    ],
  },
  {
    id: 'profile-lodge',
    stepNumber: 7,
    badge: 'Profile & Group Access',
    title: 'Join by Code & Track "My Lodge"',
    subtitle: 'Your personal headquarters for managing active leases and joining friend groups.',
    bullets: [
      { icon: 'key-outline', text: 'Join by Code: Enter a friend’s pod code to join their lodge' },
      { icon: 'home-outline', text: 'My Lodge: View your booked, paid, and active property leases' },
      { icon: 'time-outline', text: 'Track review statuses and slot deadlines in real time' },
    ],
  },
];
