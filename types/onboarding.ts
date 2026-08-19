export type LayoutType = 'self_contain' | 'single_room' | 'flat' | 'any';

export type Amenity =
  | 'generator'
  | 'borehole'
  | 'fenced_gate'
  | 'wifi'
  | 'water_heater'
  | 'wardrobe'
  | 'kitchen'
  | 'parking';

export type OnboardingData = {
  minBudget: string;
  maxBudget: string;
  preferredArea: string;
  preferredLayout: LayoutType | null;
  mustHaveAmenities: Amenity[];
};

export const ONBOARDING_STEPS = 2;

export const BUDGET_PRESETS = [
  { label: '₦100k', value: 100000 },
  { label: '₦250k', value: 250000 },
  { label: '₦500k', value: 500000 },
  { label: '₦1M', value: 1000000 },
  { label: '₦2M', value: 2000000 },
  { label: '₦4.5M', value: 4500000 },
] as const;

export const FUT_MINNA_AREAS = [
  'Bosso',
  'GK',
  'Living Faith',
  'RCF',
  'Dama',
  'Gidan Mangaro',
  'Talba Road',
  'KFF',
] as const;

export const LAYOUT_OPTIONS: { id: LayoutType; label: string; icon: string }[] = [
  { id: 'self_contain', label: 'Self Contain', icon: 'home-outline' },
  { id: 'single_room', label: 'Single Room', icon: 'bed-outline' },
  { id: 'flat', label: '2-Bed Flat', icon: 'business-outline' },
  { id: 'any', label: 'Any', icon: 'apps-outline' },
];

export const AMENITY_OPTIONS: { id: Amenity; label: string; icon: string }[] = [
  { id: 'generator', label: 'Generator', icon: 'flash-outline' },
  { id: 'borehole', label: 'Borehole', icon: 'water-outline' },
  { id: 'fenced_gate', label: 'Fenced Gate', icon: 'shield-checkmark-outline' },
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi-outline' },
  { id: 'water_heater', label: 'Water Heater', icon: 'flame-outline' },
  { id: 'wardrobe', label: 'Wardrobe', icon: 'cube-outline' },
  { id: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline' },
  { id: 'parking', label: 'Parking', icon: 'car-outline' },
];

export const SCHOOLS = [
  'Federal University of Technology, Minna (FUT Minna)',
] as const;

export const SCHOOLS_BY_CITY: Record<string, string[]> = {
  Minna: ['Federal University of Technology, Minna (FUT Minna)'],
};

export const CAMPUSES_BY_SCHOOL: Record<string, { id: string; label: string }[]> = {
  'Federal University of Technology, Minna (FUT Minna)': [
    { id: 'gidan-kwano', label: 'Gidan Kwano (Main Campus)' },
    { id: 'bosso', label: 'Bosso Campus' },
  ],
};

export function getSchoolsForCity(city: string): string[] {
  return SCHOOLS_BY_CITY[city] ?? [];
}

export function getCampusesForSchool(school: string): { id: string; label: string }[] {
  return CAMPUSES_BY_SCHOOL[school] ?? [];
}

export const defaultOnboardingData = (): OnboardingData => ({
  minBudget: '100000',
  maxBudget: '250000',
  preferredArea: '',
  preferredLayout: null,
  mustHaveAmenities: [],
});
