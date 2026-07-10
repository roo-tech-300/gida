export type LifestyleChip = {
  label: string;
  value: string;
};

export type RoommateProfile = {
  id: string;
  name: string;
  age: number;
  avatar: any;
  university: string;
  department: string;
  level: string;
  compatibility: number;
  moveInDate: string;
  budget: string;
  bio: string;
  chips: LifestyleChip[];
};
