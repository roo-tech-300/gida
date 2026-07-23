import { Stack } from 'expo-router';

import { AdminCreationProvider } from '@/context/admin-creation-context';
import { CreateListingProvider } from '@/context/create-listing-context';
import { DesignColors } from '@/constants/design';

export default function AdminLayout() {
  return (
    <AdminCreationProvider>
      <CreateListingProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: DesignColors.surfaceContainerLowest } }} />
      </CreateListingProvider>
    </AdminCreationProvider>
  );
}
