import type { Href } from 'expo-router';

import type { AdminRole } from '@/context/auth-context';

export const ADMIN_TODAY_ROUTE: Href = '/admin/today';

/** Where each role manages listings, landlords, regions and teams. Today is the daily work, this is the setup. */
export const ADMIN_MANAGE_ROUTE: Record<AdminRole, Href> = {
  super_admin: '/admin/super-dashboard',
  regional_admin: '/admin/regional-dashboard',
  field_admin: '/admin/field-dashboard',
};

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super admin',
  regional_admin: 'Regional admin',
  field_admin: 'Field admin',
};
