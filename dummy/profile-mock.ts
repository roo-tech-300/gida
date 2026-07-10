export interface ProfileData {
  avatar: string;
  verified: boolean;
  name: string;
  university: string;
  department: string;
  level: string;
  email: string;
  roommateProfile: {
    completion: number;
    sleepSchedule: string;
    cleanlinessLevel: string;
    maxBudget: string;
  };
}

export const studentProfile: ProfileData = {
  avatar: 'https://lh3.googleusercontent.com/aida/AP1WRLsmvqTDBjEmM45DDYYSmsMt_3VxZT3n86WlVOz3aY2XVCnBjaqDDMX9CaI7WwrBSy-u_1RH1N2C6P4uCVJyMoWDQsLtEzv2R9LvEERJ0eqOmGMnpz2LZ3JycrOm8hnXovn0ZivvFX2v2iLAEv3cFSR3Vg9d0wtECnWlhatd6G0II5vuC_7e3LCoU05CCpgQ-0pSlKmmaKa1RiMzC3TPJGk6hfdko9esF8bzZYFbRXR9sB8bEa4YBYHlRlg',
  verified: true,
  name: 'Danjuma Ibrahim',
  university: 'FUTMinna',
  department: 'Cyber Security',
  level: '300L',
  email: 'danjuma.ibrahim@futminna.edu.ng',
  roommateProfile: {
    completion: 90,
    sleepSchedule: 'Night Owl (12AM - 7AM)',
    cleanlinessLevel: 'Very High / Organized',
    maxBudget: '₦150k - ₦250k',
  },
};
