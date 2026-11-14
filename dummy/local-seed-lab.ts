/**
 * "State lab": listings and students built to exercise every data case the property
 * screen, reservation flow and spots-left badges have to handle. Each listing is named
 * for what it tests; the sign-in table is in docs/local-dev.md.
 *
 * Added by the full seed, or to an already-seeded database with `npm run db:seed:lab`.
 * Lab accounts only ever hold lab reservations, so the main demo accounts stay untouched.
 */
import type { SeedHousehold, SeedListing, SeedReview, SeedUser } from './local-seed-data.ts';

const BOSSO_CAMPUS = 'FUT Minna, Bosso Campus';
const LAB_PREFIX = 'Lab · ';

const person = (key: string, fullName: string, gender: SeedUser['gender']): SeedUser => ({
  key, email: `${key.replace(/^lab/, 'lab.')}@gida.test`, fullName, username: key, gender, onboarded: true,
});

export const LAB_USERS: SeedUser[] = [
  person('labpay', 'Lab Pay (hold running)', 'FEMALE'),
  person('labsolo', 'Lab Solo (hold ending)', 'MALE'),
  person('lablate', 'Lab Late (hold ended)', 'FEMALE'),
  person('labrej', 'Lab Rejected', 'MALE'),
  person('labcan', 'Lab Cancelled', 'FEMALE'),
  person('laba', 'Lab Housemate A', 'FEMALE'),
  person('labb', 'Lab Housemate B', 'FEMALE'),
  person('labc', 'Lab Housemate C', 'FEMALE'),
  person('labd', 'Lab Housemate D', 'FEMALE'),
];

const ALL_PHOTOS = [
  'lodges/lodge-exterior.jpg', 'lodges/shared-two-bed.jpg', 'lodges/sitting-room.jpg',
  'lodges/shared-kitchen.jpg', 'lodges/self-contain-room.jpg', 'houses/Gemini_Generated_Image_6dzkv56dzkv56dzk.jpg',
];

const base = {
  landlord: 'alhaji', admin: 'field', layout: 'self_contain', bedrooms: 0, bathrooms: 1, maxRoommates: 1,
  campus: BOSSO_CAMPUS, region: 'bosso', lat: 9.6502, lng: 6.5231, amenities: { borehole: true }, features: [] as string[],
  rules: ['Quiet hours 10pm to 6am'], photos: ALL_PHOTOS.slice(0, 3),
} as const satisfies Partial<SeedListing>;

const solo = (key: string, title: string, landmark: string, price: number): SeedListing => ({
  ...base, key, title: `${LAB_PREFIX}${title}`, landmark, priceTotal: price, rules: [...base.rules], features: [],
  description: 'Private self-contain room for one student. A state-lab listing: sign in as the account named in docs/local-dev.md.',
  amenities: { ...base.amenities }, photos: [...base.photos], layout: 'self_contain',
});

export const LAB_LISTINGS: SeedListing[] = [
  {
    ...solo('labbare', 'Bare minimum', 'Off Bosso road', 90000),
    description: null, rules: [], amenities: {}, photos: ALL_PHOTOS.slice(0, 1), lat: undefined, lng: undefined, bathrooms: 0, layout: 'single_room',
  },
  {
    key: 'labfull', title: `${LAB_PREFIX}Fully loaded corner flat with every amenity, a very long name and a long address line`,
    landlord: 'chief', admin: 'field', layout: 'flat', priceTotal: 2400000, bedrooms: 3, bathrooms: 3, maxRoommates: 4, units: 3,
    sizeSqft: 1200, totalFloors: 2, campus: BOSSO_CAMPUS, region: 'bosso', lat: 9.6471, lng: 6.5259, featured: true,
    landmark: 'Opposite the Bosso main gate, beside the old filling station on the Minna to Paiko road',
    description: 'A corner flat on the first floor of a gated estate, five minutes on foot from the Bosso main gate. Three bedrooms, three bathrooms, a large sitting room, a fitted kitchen and a covered balcony. Water comes from a borehole with a storage tank, power from a generator and an inverter, and the estate has a night guard, CCTV and a keke stop at the gate. Rent covers estate dues, waste collection and weekly cleaning of the shared areas. Landlord lives off site and answers repairs within a day. Perfect for a group of four who want everything in one place.',
    amenities: { borehole: true, generator: true, fencedGate: true, internet: true, burglary: true, cabinet: true, wardrobe: true, sharedKitchen: true, sharedBathroom: true },
    features: ['Borehole Water', 'Inverter backup', 'CCTV and night guard', 'Covered balcony', 'Weekly cleaning of shared areas', 'Keke stop at the gate', 'Estate dues included', 'Fibre internet'],
    rules: ['No loud music after 10pm', 'Visitors leave by 9pm', 'No smoking indoors', 'Keep the kitchen clean after use', 'Share the cleaning rota weekly'],
    photos: ALL_PHOTOS,
  },
  { ...solo('labnophoto', 'No photos', 'Behind Bosso market', 120000), photos: [] },
  { ...solo('labtwo', 'Two photos', 'Near RCF junction', 130000), photos: ALL_PHOTOS.slice(0, 2) },
  {
    ...solo('labone', 'One spot left', 'Living Faith church road', 540000),
    layout: 'flat', bedrooms: 2, bathrooms: 2, maxRoommates: 3, amenities: { borehole: true, fencedGate: true, wardrobe: true },
  },
  { ...solo('labpay', 'Pay: hold running', 'Talba Road', 560000), layout: 'flat', bedrooms: 2, maxRoommates: 2 },
  solo('labsolo', 'Pay: solo, hold ending', 'Bosso estate road', 200000),
  solo('lablate', 'Pay: hold ended', 'Behind the Bosso clinic', 210000),
  solo('labrej', 'Request not approved', 'GK shuttle road', 190000),
  solo('labcan', 'Cancelled request', 'Bosso bypass', 180000),
];

const member = (user: string, status: SeedHousehold['members'][number]['status'], createdHoursAgo: number) => ({ user, status, createdHoursAgo });

export const LAB_HOUSEHOLDS: SeedHousehold[] = [
  {
    key: 'lab-one-left', listing: 'labone', targetOccupancy: 3, gender: 'FEMALE', verification: 'approved', groupCode: 'LABONE', holdEndsInHours: 0,
    members: [member('laba', 'paid_unmatched', 90), member('labb', 'paid_unmatched', 80)],
  },
  {
    key: 'lab-full', listing: 'labfull', targetOccupancy: 4, gender: 'FEMALE', verification: 'approved', groupCode: 'LABFUL', holdEndsInHours: 0,
    members: [member('laba', 'paid_unmatched', 200), member('labb', 'paid_unmatched', 190), member('labc', 'paid_unmatched', 180), member('labd', 'paid_unmatched', 170)],
  },
  {
    key: 'lab-pay', listing: 'labpay', targetOccupancy: 2, gender: 'FEMALE', verification: 'approved', groupCode: 'LABPAY', holdEndsInHours: 20,
    members: [member('labpay', 'booked_pending_claim', 52)],
  },
  {
    key: 'lab-solo', listing: 'labsolo', targetOccupancy: 1, gender: 'MALE', verification: 'approved', groupCode: 'LABSOL', holdEndsInHours: 0.5,
    members: [member('labsolo', 'booked_pending_claim', 71)],
  },
  {
    key: 'lab-late', listing: 'lablate', targetOccupancy: 1, gender: 'FEMALE', verification: 'approved', groupCode: 'LABLAT', holdEndsInHours: -1,
    members: [member('lablate', 'booked_pending_claim', 74)],
  },
  {
    key: 'lab-rejected', listing: 'labrej', targetOccupancy: 1, gender: 'MALE', verification: 'rejected', groupCode: 'LABREJ', holdEndsInHours: 40,
    members: [member('labrej', 'rejected', 30)],
  },
  {
    key: 'lab-cancelled', listing: 'labcan', targetOccupancy: 1, gender: 'FEMALE', verification: 'approved', groupCode: 'LABCAN', holdEndsInHours: 36,
    members: [member('labcan', 'cancelled', 30)],
  },
];

export const LAB_REVIEWS: SeedReview[] = [
  { user: 'laba', listing: 'labfull', rating: 5, text: 'Everything works: water, power, internet. The estate guard knows every resident by name.' },
  { user: 'labb', listing: 'labfull', rating: 4, text: 'Great flat. The balcony is a bit hot in the afternoon but we use it all evening.', anonymous: true },
  { user: 'labc', listing: 'labfull', rating: 5, text: 'Landlord fixed our tap within a day. Cleaning of the shared areas is on time every week and we have never had to chase anyone for it, which honestly surprised all four of us after our last place.' },
  { user: 'labd', listing: 'labfull', rating: 3, text: 'Good value, though the generator is loud at night.', anonymous: true },
  { user: 'laba', listing: 'labone', rating: 4, text: 'Quiet street and a short walk to the road.' },
];
