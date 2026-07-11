import { Stack } from 'expo-router';

import { AdminCreationProvider } from '@/context/admin-creation-context';

export default function AdminLayout() {
  return (
    <AdminCreationProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AdminCreationProvider>
  );
}
