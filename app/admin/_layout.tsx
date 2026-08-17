import { Stack } from 'expo-router';

import { AdminCreationProvider } from '@/context/admin-creation-context';
import { CreateListingProvider } from '@/context/create-listing-context';
import { TourAlertsProvider } from '@/context/tour-alerts-context';
import { DesignColors } from '@/constants/design';

export default function AdminLayout() {
  return (
    <TourAlertsProvider>
      <AdminCreationProvider>
        <CreateListingProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: DesignColors.surfaceContainerLowest } }} />
        </CreateListingProvider>
      </AdminCreationProvider>
    </TourAlertsProvider>
  );
}
