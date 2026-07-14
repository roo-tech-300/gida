import { Stack } from 'expo-router';

import { AdminCreationProvider } from '@/context/admin-creation-context';
import { CreateListingProvider } from '@/context/create-listing-context';

export default function AdminLayout() {
  return (
    <AdminCreationProvider>
      <CreateListingProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CreateListingProvider>
    </AdminCreationProvider>
  );
}
