export type SleepSchedule = 'early' | 'late' | 'flexible';

export type OnboardingData = {
  city: string;
  smokerAllowed: boolean;
  sleepSchedule: SleepSchedule | null;
  maxBudget: string;
  preferredArea: string;
  isStudent: boolean;
  school: string;
};

export const ONBOARDING_STEPS = 4;

export const SUGGESTED_CITIES = ['Abuja', 'Lagos', 'Jos'] as const;

export const SCHOOLS = [
  'Federal University of Technology, Minna (FUT Minna)',
  'University of Lagos (UNILAG)',
  'Covenant University',
  'Ahmadu Bello University',
] as const;

export const SCHOOLS_BY_CITY: Record<string, string[]> = {
  Minna: ['Federal University of Technology, Minna (FUT Minna)'],
  Lagos: ['University of Lagos (UNILAG)'],
  Abuja: [],
  Jos: [],
};

export const CAMPUSES_BY_SCHOOL: Record<string, { id: string; label: string }[]> = {
  'Federal University of Technology, Minna (FUT Minna)': [
    { id: 'gidan-kwano', label: 'Gidan Kwano (Main Campus)' },
    { id: 'bosso', label: 'Bosso Campus' },
  ],
  'University of Lagos (UNILAG)': [
    { id: 'akoka', label: 'Akoka (Main Campus)' },
  ],
};

export function getSchoolsForCity(city: string): string[] {
  return SCHOOLS_BY_CITY[city] ?? [];
}

export function getCampusesForSchool(school: string): { id: string; label: string }[] {
  return CAMPUSES_BY_SCHOOL[school] ?? [];
}

export const SLEEP_SCHEDULE_OPTIONS: {
  id: SleepSchedule;
  label: string;
  description: string;
}[] = [
  { id: 'early', label: 'Early bird', description: 'Asleep before 10pm' },
  { id: 'late', label: 'Night owl', description: 'Active past midnight' },
  { id: 'flexible', label: 'Flexible', description: 'No fixed schedule' },
];

export const defaultOnboardingData = (): OnboardingData => ({
  city: '',
  smokerAllowed: false,
  sleepSchedule: null,
  maxBudget: '',
  preferredArea: '',
  isStudent: true,
  school: SCHOOLS[0],
});
