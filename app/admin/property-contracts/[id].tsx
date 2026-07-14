import { useLocalSearchParams } from 'expo-router';

import { PropertyContractsScreen } from '@/components/admin/property-contracts-screen';

export default function PropertyContractsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PropertyContractsScreen propertyId={id} />;
}
