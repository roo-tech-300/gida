import { useLocalSearchParams } from 'expo-router';

import { TourDetailScreen } from '@/components/admin/tour-detail-screen';

export default function AdminTourDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TourDetailScreen bookingId={id} />;
}
