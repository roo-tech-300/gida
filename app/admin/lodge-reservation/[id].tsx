import { useLocalSearchParams } from 'expo-router';

import { LodgeReservationDetailScreen } from '@/components/admin/lodge-reservation-detail-screen';

export default function AdminLodgeReservationDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LodgeReservationDetailScreen podId={id} />;
}
