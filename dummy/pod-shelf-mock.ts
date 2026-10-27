import { makeDbListing } from '@/dummy/listing-fixture';
import type { RecommendedPod } from '@/types/pod-recommendation';

type Seed = {
  id: string;
  title: string;
  area: string;
  price: number;
  target: number;
  members: { name: string; gender: 'MALE' | 'FEMALE' }[];
};

const SEEDS: Seed[] = [
  {
    id: 'pod-mock-1',
    title: 'Sunrise Lodge, Gidan Kwano',
    area: 'Gidan Kwano',
    price: 1_200_000,
    target: 3,
    members: [{ name: 'Amina Bello', gender: 'FEMALE' }],
  },
  {
    id: 'pod-mock-2',
    title: 'Emerald Court, Dama',
    area: 'Dama',
    price: 900_000,
    target: 2,
    members: [{ name: 'Chidi Okafor', gender: 'MALE' }],
  },
  {
    id: 'pod-mock-3',
    title: 'Palm Haven, Bosso',
    area: 'Bosso',
    price: 1_500_000,
    target: 4,
    members: [
      { name: 'Fatima Yusuf', gender: 'FEMALE' },
      { name: 'Zainab Abdullah', gender: 'FEMALE' },
    ],
  },
  {
    id: 'pod-mock-4',
    title: 'Kpakungu Heights',
    area: 'Kpakungu',
    price: 720_000,
    target: 3,
    members: [
      { name: 'Daniel Adamu', gender: 'MALE' },
      { name: 'Alex Musa', gender: 'MALE' },
    ],
  },
  {
    id: 'pod-mock-5',
    title: 'Tunga Terrace, Gidan Kwano',
    area: 'Gidan Kwano',
    price: 1_080_000,
    target: 4,
    members: [{ name: 'Blessing Eze', gender: 'FEMALE' }],
  },
  {
    id: 'pod-mock-6',
    title: 'Maikunkele Court',
    area: 'Maikunkele',
    price: 600_000,
    target: 2,
    members: [{ name: 'Ibrahim Sani', gender: 'MALE' }],
  },
];

export const MOCK_RECOMMENDED_PODS: RecommendedPod[] = SEEDS.map((seed, index) => ({
  id: seed.id,
  estate_id: `estate-mock-${index + 1}`,
  property_tier: seed.target,
  matched_gender: seed.members[0]?.gender ?? 'ANY',
  members: seed.members.map((member, memberIndex) => ({
    user_id: `${seed.id}-user-${memberIndex + 1}`,
    full_name: member.name,
    intent_size: 1,
    campus: 'FUT Minna',
    major: 'Computer Science',
    cleanliness_score: 5,
    sleep_schedule: 'Midnight (12 AM)',
    slot_credit_id: `${seed.id}-credit-${memberIndex + 1}`,
    profile: {
      id: `${seed.id}-user-${memberIndex + 1}`,
      full_name: member.name,
      avatar_url: null,
      gender: member.gender,
    },
  })),
  current_total_intent: seed.members.length,
  target_occupancy: seed.target,
  is_finalized: false,
  created_at: new Date().toISOString(),
  listing_id: `${seed.id}-listing`,
  verification_status: 'approved',
  score: 100 - index,
  listing: makeDbListing({
    id: `${seed.id}-listing`,
    title: seed.title,
    price_amount: seed.price,
    property_tier: seed.target,
    max_roommates: seed.target,
    campus: 'FUT Minna',
    location_landmark: seed.area,
    city: 'Minna',
  }),
}));
