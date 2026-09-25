import type { Ionicons } from '@expo/vector-icons';

export type AppTourStepId =
  | 'search'
  | 'switch-views'
  | 'tours'
  | 'booking'
  | 'messages'
  | 'saved'
  | 'profile-lodge';

export type TourFeatureBullet = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

export type AppTourStep = {
  id: AppTourStepId;
  stepNumber: number;
  badge: string;
  title: string;
  subtitle: string;
  bullets: TourFeatureBullet[];
};
