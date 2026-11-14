/**
 * Seed data for the LOCAL Supabase stack (scripts/dev/seed-local.ts).
 * Every account uses LOCAL_SEED_PASSWORD. Never run against a hosted project.
 *
 * Covers each state the redesign needs to show:
 * - Ada: in an approved household, her share unpaid, hold running (My Home "next step")
 * - Amina: same household, already paid
 * - Zainab: solo request waiting for admin review (admin "Today" queue, oldest)
 * - Tobi: solo booking paid (booking confirmed, can review)
 * - Chidi: reservation expired (expired banner)
 * - Fatima: invited into Ada's household (invite CTA), booked a tour
 * - Halima, Sani: fresh requests waiting in the admin "Today" queue (green and amber waits)
 * - new@: fresh account that has not finished onboarding
 */

export const LOCAL_SEED_PASSWORD = 'GidaDev!2026';

export type SeedGender = 'MALE' | 'FEMALE';
export type SeedAdminRole = 'super_admin' | 'regional_admin' | 'field_admin';
export type SeedRegionKey = 'niger' | 'minna' | 'bosso' | 'gk';

export interface SeedUser {
  key: string;
  email: string;
  fullName: string;
  username: string;
  gender: SeedGender;
  onboarded: boolean;
  /** Path under dummy/images, uploaded to the avatars bucket. */
  avatar?: string;
  school?: string;
  level?: number;
  bio?: string;
  religion?: string;
  inRoommateFeed?: boolean;
  admin?: { role: SeedAdminRole; region: SeedRegionKey };
  living?: { minBudget: number; maxBudget: number; area: string; layout: string };
  roommate?: { sleep: string; cleanliness: string; guests: string; study: string; personality: string };
}

export interface SeedRegion {
  key: SeedRegionKey;
  name: string;
  parent?: SeedRegionKey;
}

export interface SeedLandlord {
  key: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface SeedListing {
  key: string;
  title: string;
  /** Null leaves the listing without a description. */
  description: string | null;
  landlord: string;
  admin: string;
  layout: 'self_contain' | 'single_room' | 'flat';
  priceTotal: number;
  slashedPrice?: number;
  bedrooms: number;
  bathrooms: number;
  maxRoommates: number;
  landmark: string;
  campus: string;
  region: SeedRegionKey;
  /** Leave out to seed a listing with no map location (tours are then unavailable). */
  lat?: number;
  lng?: number;
  featured?: boolean;
  sizeSqft?: number;
  totalFloors?: number;
  /** Number of identical units; spots = tier × units. Defaults to 1. */
  units?: number;
  amenities: Partial<Record<'borehole' | 'generator' | 'fencedGate' | 'internet' | 'burglary' | 'cabinet' | 'wardrobe' | 'sharedKitchen' | 'sharedBathroom', boolean>>;
  features: string[];
  rules: string[];
  /** Paths under dummy/images, first one becomes primary_image. An empty list seeds a listing with no photos. */
  photos: string[];
}

export type SeedCreditStatus = 'booked_pending_claim' | 'paid_unmatched' | 'expired' | 'cancelled' | 'rejected';

export interface SeedHouseholdMember {
  user: string;
  status: SeedCreditStatus;
  /** Hours from now: negative = in the past. */
  createdHoursAgo: number;
  /** Overrides the household's hold deadline for this member (hours from now; negative = already past). */
  holdEndsInHours?: number;
  /** Gives this member's credit a parent pay link in this state. */
  link?: 'open' | 'expired' | 'revoked';
}

export interface SeedInvite {
  invitee: string;
  inviter: string;
  /** Defaults to pending. */
  status?: 'pending' | 'accepted' | 'declined';
}

export interface SeedHousehold {
  key: string;
  listing: string;
  targetOccupancy: number;
  gender: 'MALE' | 'FEMALE' | 'ANY';
  verification: 'pending_verification' | 'approved' | 'rejected';
  groupCode: string;
  /** Hours from now until the hold ends for unpaid members. */
  holdEndsInHours: number;
  members: SeedHouseholdMember[];
  invite?: { invitee: string; inviter: string };
  /** More than one invitation, with their outcomes. */
  invites?: SeedInvite[];
  /** The household is full and closed to new members. */
  finalized?: boolean;
  /** A physical room (door number) is assigned to the household. */
  room?: string;
}

export interface SeedMessage {
  from: string;
  body: string;
  minutesAgo: number;
  attachment?: 'reservation' | 'approved' | { listing: string };
}

export interface SeedConversation {
  between: [string, string];
  /** Household the reservation/decision attachments refer to. */
  household?: string;
  messages: SeedMessage[];
}

export interface SeedTour {
  user: string;
  listing: string;
  admin: string;
  dayOffset: number;
  time: string;
  status: 'pending_payment' | 'booked' | 'completed';
}

export interface SeedReview {
  user: string;
  listing: string;
  rating: number;
  text: string;
  /** Defaults to false (name shown). */
  anonymous?: boolean;
}

export const SEED_REGIONS: SeedRegion[] = [
  { key: 'niger', name: 'Niger State' },
  { key: 'minna', name: 'Minna', parent: 'niger' },
  { key: 'bosso', name: 'Bosso', parent: 'minna' },
  { key: 'gk', name: 'Gidan Kwano', parent: 'minna' },
];

const BOSSO_CAMPUS = 'FUT Minna, Bosso Campus';
const GK_CAMPUS = 'FUT Minna, Gidan Kwano Campus';

export const SEED_USERS: SeedUser[] = [
  {
    key: 'super', email: 'super@gida.test', fullName: 'Ngozi Eke', username: 'ngozi.eke', gender: 'FEMALE', onboarded: true,
    admin: { role: 'super_admin', region: 'niger' },
  },
  {
    key: 'regional', email: 'regional@gida.test', fullName: 'Ibrahim Sule', username: 'ibrahim.sule', gender: 'MALE', onboarded: true,
    admin: { role: 'regional_admin', region: 'minna' },
  },
  {
    key: 'field', email: 'field@gida.test', fullName: 'Musa Ibrahim', username: 'musa.ibrahim', gender: 'MALE', onboarded: true,
    admin: { role: 'field_admin', region: 'bosso' },
  },
  {
    key: 'ada', email: 'ada@gida.test', fullName: 'Ada Okafor', username: 'ada.okafor', gender: 'FEMALE', onboarded: true,
    avatar: 'people/student-braids-portrait.jpg', school: 'Federal University of Technology, Minna', level: 200,
    bio: 'Biochemistry, 200L. Early riser, tidy, I cook a lot of jollof.', religion: 'Christianity', inRoommateFeed: true,
    living: { minBudget: 150000, maxBudget: 300000, area: 'Bosso', layout: 'flat' },
    roommate: { sleep: 'early_bird', cleanliness: 'neat_freak', guests: 'occasional_guests', study: 'room_silent', personality: 'ambivert' },
  },
  {
    key: 'amina', email: 'amina@gida.test', fullName: 'Amina Bello', username: 'amina.bello', gender: 'FEMALE', onboarded: true,
    avatar: 'people/Amina.png', school: 'Federal University of Technology, Minna', level: 200,
    bio: 'Microbiology. Quiet during the week, fun at weekends.', religion: 'Islam', inRoommateFeed: true,
    living: { minBudget: 150000, maxBudget: 300000, area: 'Bosso', layout: 'flat' },
    roommate: { sleep: 'early_bird', cleanliness: 'moderate', guests: 'quiet', study: 'library_outside', personality: 'introvert' },
  },
  {
    key: 'zainab', email: 'zainab@gida.test', fullName: 'Zainab Abdullahi', username: 'zainab.a', gender: 'FEMALE', onboarded: true,
    avatar: 'people/student-hijab-portrait.jpg', school: 'Federal University of Technology, Minna', level: 300,
    bio: 'Architecture, 300L. Night owl during studio weeks.', religion: 'Islam', inRoommateFeed: true,
    living: { minBudget: 150000, maxBudget: 250000, area: 'GK', layout: 'self_contain' },
    roommate: { sleep: 'night_owl', cleanliness: 'neat_freak', guests: 'quiet', study: 'room_music', personality: 'introvert' },
  },
  {
    key: 'fatima', email: 'fatima@gida.test', fullName: 'Fatima Musa', username: 'fatima.musa', gender: 'FEMALE', onboarded: true,
    avatar: 'people/female-market.png', school: 'Federal University of Technology, Minna', level: 100,
    bio: 'Computer Science, 100L. New to Minna, looking for good people to live with.', religion: 'Islam', inRoommateFeed: true,
    living: { minBudget: 100000, maxBudget: 300000, area: 'Bosso', layout: 'any' },
    roommate: { sleep: 'flexible', cleanliness: 'moderate', guests: 'social_hub', study: 'library_outside', personality: 'extrovert' },
  },
  {
    key: 'tobi', email: 'tobi@gida.test', fullName: 'Tobi Adeyemi', username: 'tobi.adeyemi', gender: 'MALE', onboarded: true,
    avatar: 'people/student-male-portrait.jpg', school: 'Federal University of Technology, Minna', level: 300,
    bio: 'Mechanical Engineering. Football on Saturdays.', religion: 'Christianity', inRoommateFeed: true,
    living: { minBudget: 200000, maxBudget: 400000, area: 'Bosso', layout: 'self_contain' },
    roommate: { sleep: 'night_owl', cleanliness: 'relaxed', guests: 'social_hub', study: 'room_music', personality: 'extrovert' },
  },
  {
    key: 'chidi', email: 'chidi@gida.test', fullName: 'Chidi Eze', username: 'chidi.eze', gender: 'MALE', onboarded: true,
    avatar: 'people/male-street.png', school: 'Federal University of Technology, Minna', level: 100,
    bio: 'Electrical Engineering, 100L.', religion: 'Christianity', inRoommateFeed: true,
    living: { minBudget: 300000, maxBudget: 700000, area: 'Talba Road', layout: 'flat' },
    roommate: { sleep: 'flexible', cleanliness: 'moderate', guests: 'occasional_guests', study: 'room_silent', personality: 'ambivert' },
  },
  {
    key: 'halima', email: 'halima@gida.test', fullName: 'Halima Bello', username: 'halima.bello', gender: 'FEMALE', onboarded: true,
    school: 'Federal University of Technology, Minna', level: 200, living: { minBudget: 150000, maxBudget: 300000, area: 'GK', layout: 'flat' },
  },
  {
    key: 'sani', email: 'sani@gida.test', fullName: 'Sani Lawal', username: 'sani.lawal', gender: 'MALE', onboarded: true,
    school: 'Federal University of Technology, Minna', level: 100, living: { minBudget: 100000, maxBudget: 200000, area: 'Bosso', layout: 'single_room' },
  },
  {
    key: 'newbie', email: 'new@gida.test', fullName: 'Kemi Danjuma', username: 'kemi.danjuma', gender: 'FEMALE', onboarded: false,
  },
];

export const SEED_LANDLORDS: SeedLandlord[] = [
  { key: 'alhaji', fullName: 'Alhaji Usman Garba', phone: '+2348031110001', email: 'usman.garba@landlord.test' },
  { key: 'mrsokoro', fullName: 'Mrs Grace Okoro', phone: '+2348031110002', email: 'grace.okoro@landlord.test' },
  { key: 'chief', fullName: 'Chief Emeka Nwosu', phone: '+2348031110003', email: 'emeka.nwosu@landlord.test' },
];

export const SEED_LISTINGS: SeedListing[] = [
  {
    key: 'royal', title: 'Royal Lodge, 2-bed shared flat', landlord: 'alhaji', admin: 'field', layout: 'flat',
    description: 'Newly built flat five minutes from the Bosso main gate. Two bedrooms shared by four students, a sitting room, a shared kitchen with gas cooker and a tiled bathroom. Borehole water all day and a prepaid meter per flat.',
    priceTotal: 1000000, bedrooms: 2, bathrooms: 1, maxRoommates: 4, landmark: 'Opposite Bosso main gate', campus: BOSSO_CAMPUS,
    region: 'bosso', lat: 9.6528, lng: 6.5246, featured: true,
    amenities: { borehole: true, fencedGate: true, burglary: true, wardrobe: true, sharedKitchen: true },
    features: ['Prepaid meter', '24/7 water', '6 min walk to gate'],
    rules: ['No loud music after 10pm', 'Visitors leave by 9pm', 'Keep the kitchen clean after use'],
    photos: ['lodges/lodge-exterior.jpg', 'lodges/shared-two-bed.jpg', 'lodges/sitting-room.jpg', 'lodges/shared-kitchen.jpg'],
  },
  {
    key: 'prime', title: 'Prime Lodge self-contain', landlord: 'alhaji', admin: 'field', layout: 'self_contain',
    description: 'Private self-contained room with its own bathroom, wardrobe and study desk. Quiet compound with a fenced gate and a security man at night.',
    priceTotal: 280000, slashedPrice: 320000, bedrooms: 0, bathrooms: 1, maxRoommates: 1, landmark: 'Behind Bosso market', campus: BOSSO_CAMPUS,
    region: 'bosso', lat: 9.6491, lng: 6.5212,
    amenities: { borehole: true, fencedGate: true, burglary: true, wardrobe: true, cabinet: true },
    features: ['Own bathroom', 'Night security'],
    rules: ['No cooking with charcoal', 'Quiet hours 10pm to 6am'],
    photos: ['lodges/self-contain-room.jpg', 'lodges/lodge-exterior.jpg', 'houses/Gemini_Generated_Image_1wlh0m1wlh0m1wlh.jpg'],
  },
  {
    key: 'gkhaven', title: 'Gidan Kwano Haven', landlord: 'mrsokoro', admin: 'regional', layout: 'self_contain',
    description: 'Self-contain rooms a short keke ride from the Gidan Kwano campus. Solar backup for lights and fans, borehole water and a shared courtyard.',
    priceTotal: 220000, bedrooms: 0, bathrooms: 1, maxRoommates: 1, landmark: 'GK junction, along campus road', campus: GK_CAMPUS,
    region: 'gk', lat: 9.5357, lng: 6.4526,
    amenities: { borehole: true, generator: true, fencedGate: true, wardrobe: true },
    features: ['Solar backup', 'Keke stop at the gate'],
    rules: ['Visitors sign in at the gate'],
    photos: ['lodges/self-contain-room.jpg', 'houses/Gemini_Generated_Image_5d7v1i5d7v1i5d7v.jpg', 'lodges/lodge-exterior.jpg'],
  },
  {
    key: 'talba', title: 'Talba Court, 2-bed flat', landlord: 'chief', admin: 'regional', layout: 'flat',
    description: 'Spacious two-bedroom flat for two students who want their own rooms. Big sitting room, private kitchen and a balcony.',
    priceTotal: 600000, bedrooms: 2, bathrooms: 2, maxRoommates: 2, landmark: 'Talba Road, near Shiroro Hotel', campus: BOSSO_CAMPUS,
    region: 'minna', lat: 9.6175, lng: 6.5463,
    amenities: { borehole: true, generator: true, internet: true, fencedGate: true, burglary: true, wardrobe: true, cabinet: true },
    features: ['Balcony', 'Wi-Fi included', 'Generator 6pm to 11pm'],
    rules: ['No pets', 'Rent covers water and estate dues'],
    photos: ['houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.jpg', 'houses/Gemini_Generated_Image_5j0rak5j0rak5j0r.jpg', 'lodges/shared-kitchen.jpg'],
  },
  {
    key: 'bossogate', title: 'Bosso Gate single rooms', landlord: 'mrsokoro', admin: 'field', layout: 'single_room',
    description: 'Affordable single rooms right by the school gate. Shared bathroom and kitchen per floor, cleaned twice a week.',
    priceTotal: 150000, bedrooms: 0, bathrooms: 0, maxRoommates: 1, landmark: 'Beside Bosso gate filling station', campus: BOSSO_CAMPUS,
    region: 'bosso', lat: 9.6533, lng: 6.5270,
    amenities: { borehole: true, fencedGate: true, sharedKitchen: true, sharedBathroom: true },
    features: ['2 min walk to gate', 'Cleaner twice weekly'],
    rules: ['No overnight guests'],
    photos: ['houses/Gemini_Generated_Image_1miazv1miazv1mia.jpg', 'lodges/shared-kitchen.jpg', 'lodges/lodge-exterior.jpg'],
  },
  {
    key: 'rcf', title: 'RCF Suites', landlord: 'chief', admin: 'field', layout: 'self_contain',
    description: 'Premium self-contain suites with tiled bathrooms, kitchenette and fibre internet. Ideal for final-year students who need quiet.',
    priceTotal: 350000, bedrooms: 0, bathrooms: 1, maxRoommates: 1, landmark: 'RCF junction, Bosso', campus: BOSSO_CAMPUS,
    region: 'bosso', lat: 9.6455, lng: 6.5301, featured: true,
    amenities: { borehole: true, generator: true, internet: true, fencedGate: true, burglary: true, wardrobe: true, cabinet: true },
    features: ['Fibre internet', 'Kitchenette'],
    rules: ['Quiet compound, no parties'],
    photos: ['houses/Gemini_Generated_Image_1wlh0m1wlh0m1wlh.jpg', 'lodges/self-contain-room.jpg', 'houses/Gemini_Generated_Image_5d7v1i5d7v1i5d7v.jpg'],
  },
  {
    key: 'gktwin', title: 'GK Twin Rooms', landlord: 'mrsokoro', admin: 'regional', layout: 'flat',
    description: 'One-bedroom flat shared by two, five minutes from the GK campus shuttle. Furnished sitting room and a kitchen.',
    priceTotal: 500000, bedrooms: 1, bathrooms: 1, maxRoommates: 2, landmark: 'Near GK shuttle park', campus: GK_CAMPUS,
    region: 'gk', lat: 9.5381, lng: 6.4561,
    amenities: { borehole: true, fencedGate: true, burglary: true, wardrobe: true },
    features: ['Furnished sitting room', 'Shuttle nearby'],
    rules: ['Share cleaning duties weekly'],
    photos: ['lodges/sitting-room.jpg', 'lodges/shared-two-bed.jpg', 'houses/Gemini_Generated_Image_5j0rak5j0rak5j0r.jpg'],
  },
  {
    key: 'livingfaith', title: 'Living Faith Court', landlord: 'alhaji', admin: 'field', layout: 'flat',
    description: 'Three students share a bright two-bedroom flat near Living Faith church. Good road, steady water.',
    priceTotal: 720000, bedrooms: 2, bathrooms: 2, maxRoommates: 3, landmark: 'Living Faith church road', campus: BOSSO_CAMPUS,
    region: 'bosso', lat: 9.6412, lng: 6.5188,
    amenities: { borehole: true, fencedGate: true, burglary: true, wardrobe: true, sharedKitchen: true },
    features: ['Tarred road', 'Two bathrooms'],
    rules: ['No smoking indoors'],
    photos: ['houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.jpg', 'lodges/shared-two-bed.jpg', 'lodges/sitting-room.jpg'],
  },
];

export const SEED_HOUSEHOLDS: SeedHousehold[] = [
  {
    key: 'royal-ada', listing: 'royal', targetOccupancy: 4, gender: 'FEMALE', verification: 'approved', groupCode: 'ROYAL4',
    holdEndsInHours: 55,
    members: [
      { user: 'ada', status: 'booked_pending_claim', createdHoursAgo: 26 },
      { user: 'amina', status: 'paid_unmatched', createdHoursAgo: 20 },
    ],
    invite: { invitee: 'fatima', inviter: 'ada' },
  },
  {
    key: 'gk-zainab', listing: 'gkhaven', targetOccupancy: 1, gender: 'FEMALE', verification: 'pending_verification', groupCode: 'GKZAIN',
    holdEndsInHours: 68,
    members: [{ user: 'zainab', status: 'booked_pending_claim', createdHoursAgo: 4.6 }],
  },
  {
    key: 'gktwin-halima', listing: 'gktwin', targetOccupancy: 2, gender: 'FEMALE', verification: 'pending_verification', groupCode: 'GKTWIN',
    holdEndsInHours: 71,
    members: [{ user: 'halima', status: 'booked_pending_claim', createdHoursAgo: 0.2 }],
  },
  {
    key: 'gate-sani', listing: 'bossogate', targetOccupancy: 1, gender: 'MALE', verification: 'pending_verification', groupCode: 'GATESA',
    holdEndsInHours: 70,
    members: [{ user: 'sani', status: 'booked_pending_claim', createdHoursAgo: 1.1 }],
  },
  {
    key: 'prime-tobi', listing: 'prime', targetOccupancy: 1, gender: 'MALE', verification: 'approved', groupCode: 'PRIMET',
    holdEndsInHours: 0,
    members: [{ user: 'tobi', status: 'paid_unmatched', createdHoursAgo: 240 }],
  },
  {
    key: 'talba-chidi', listing: 'talba', targetOccupancy: 2, gender: 'MALE', verification: 'approved', groupCode: 'TALBAC',
    holdEndsInHours: -24,
    members: [{ user: 'chidi', status: 'expired', createdHoursAgo: 100 }],
  },
];

export const SEED_CONVERSATIONS: SeedConversation[] = [
  {
    between: ['ada', 'field'], household: 'royal-ada',
    messages: [
      { from: 'ada', body: 'Applied for a lodge spot — awaiting your review', minutesAgo: 1560, attachment: 'reservation' },
      { from: 'field', body: 'Approved. You can pay now.', minutesAgo: 1520, attachment: 'approved' },
      { from: 'field', body: 'Hi Ada, all set on our side. Once your share is paid I will share the landlord contact for move-in.', minutesAgo: 1515 },
    ],
  },
  {
    between: ['zainab', 'regional'], household: 'gk-zainab',
    messages: [{ from: 'zainab', body: 'Applied for a lodge spot — awaiting your review', minutesAgo: 276, attachment: 'reservation' }],
  },
  {
    between: ['ada', 'amina'],
    messages: [
      { from: 'amina', body: 'I just paid my share for Royal Lodge!', minutesAgo: 1190 },
      { from: 'ada', body: 'Yay! My mum is paying mine this week.', minutesAgo: 1185 },
      { from: 'amina', body: 'Who is bringing the gas cylinder? I have a small one.', minutesAgo: 42 },
    ],
  },
  {
    between: ['ada', 'fatima'],
    messages: [
      { from: 'fatima', body: 'Hi Ada, saw your profile. Are you still looking for roommates?', minutesAgo: 300 },
      { from: 'ada', body: 'Yes! We have 2 spots left at Royal Lodge. I just sent you an invite.', minutesAgo: 290 },
      { from: 'ada', body: 'Here it is', minutesAgo: 289, attachment: { listing: 'royal' } },
    ],
  },
  {
    between: ['tobi', 'chidi'],
    messages: [
      { from: 'chidi', body: 'Bro, my Talba Court hold expired. Is Prime Lodge still open?', minutesAgo: 600 },
      { from: 'tobi', body: 'Prime is full now. Check RCF Suites, it is close.', minutesAgo: 590, attachment: { listing: 'rcf' } },
    ],
  },
];

export const SEED_TOURS: SeedTour[] = [
  { user: 'fatima', listing: 'royal', admin: 'field', dayOffset: 1, time: '10:00 AM', status: 'booked' },
  { user: 'zainab', listing: 'gkhaven', admin: 'regional', dayOffset: 0, time: '2:00 PM', status: 'booked' },
  { user: 'chidi', listing: 'rcf', admin: 'field', dayOffset: 2, time: '11:00 AM', status: 'pending_payment' },
  { user: 'tobi', listing: 'prime', admin: 'field', dayOffset: -12, time: '9:00 AM', status: 'completed' },
];

export const SEED_REVIEWS: SeedReview[] = [
  { user: 'tobi', listing: 'prime', rating: 5, text: 'Quiet compound, water never stopped once. The security man is serious.' },
  { user: 'amina', listing: 'royal', rating: 4, text: 'Very close to the gate and the flat is new. Kitchen is a bit small for four.' },
];

export const SEED_SAVED: { user: string; listing: string }[] = [
  { user: 'ada', listing: 'rcf' },
  { user: 'ada', listing: 'prime' },
  { user: 'ada', listing: 'livingfaith' },
  { user: 'fatima', listing: 'royal' },
  { user: 'zainab', listing: 'gktwin' },
];
