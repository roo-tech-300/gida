import type { ImageSourcePropType } from 'react-native';

export type LifestyleChip = {
  label: string;
  value: string;
};

export type RoommateProfile = {
  id: string;
  name: string;
  age: number;
  avatar: ImageSourcePropType | { uri: string } | null;
  university: string;
  level: string;
  compatibility: number;
  moveInDate: string;
  budget: string;
  bio: string;
  chips: LifestyleChip[];
  preferredArea?: string;
  maxBudget?: number;
  religion?: string;
  smokerAllowed?: boolean;
};
