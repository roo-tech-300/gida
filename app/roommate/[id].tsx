import { useLocalSearchParams } from 'expo-router';

import { RoommateProfileScreen } from '@/components/roommate/roommate-profile-screen';

export default function RoommateProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RoommateProfileScreen roommateId={id} />;
}
