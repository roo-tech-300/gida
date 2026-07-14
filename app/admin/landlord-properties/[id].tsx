import { useLocalSearchParams } from 'expo-router';

import { LandlordPropertiesScreen } from '@/components/admin/landlord-properties-screen';

export default function LandlordPropertiesPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LandlordPropertiesScreen landlordId={id} />;
}
