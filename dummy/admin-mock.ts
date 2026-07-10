export type AdminRole = 'super_admin' | 'regional_admin' | 'field_admin';

export type AdminMember = {
  id: string;
  full_name: string;
  role: AdminRole;
  assigned_region_id: string | null;
  region_name: string | null;
  avatar_initials: string;
};

export type Region = {
  id: string;
  name: string;
  admin_count: number;
  listing_count: number;
  critical: number;
  growth: string;
};

export type RecentAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: 'check_circle' | 'upload_file' | 'warning';
  color: 'secondary' | 'primary' | 'tertiary';
};

export type AdminDashboardStats = {
  total_regions: number;
  state_admins: number;
  field_tasks: number;
  active_hubs: number;
  critical: number;
  growth: string;
};

export const SUPER_ADMIN_MOCK = {
  id: 'admin-super-001',
  full_name: 'Eluzia Ameh-Ako',
  role: 'super_admin' as AdminRole,
  assigned_region_id: null,
};

export const REGIONAL_ADMIN_MOCK = {
  id: 'admin-reg-001',
  full_name: 'Fatima Bello',
  role: 'regional_admin' as AdminRole,
  assigned_region_id: 'region_minna',
};

export const FIELD_ADMIN_MOCK = {
  id: 'admin-field-001',
  full_name: 'Chinedu Obi',
  role: 'field_admin' as AdminRole,
  assigned_region_id: 'region_bosso',
};

export const DASHBOARD_STATS: AdminDashboardStats = {
  total_regions: 14,
  state_admins: 42,
  field_tasks: 512,
  active_hubs: 14,
  critical: 2,
  growth: '+12%',
};

export const REGIONS: Region[] = [
  { id: 'region_abuja_north', name: 'Abuja North', admin_count: 3, listing_count: 28, critical: 0, growth: '+8%' },
  { id: 'region_abuja_south', name: 'Abuja South', admin_count: 2, listing_count: 22, critical: 1, growth: '+5%' },
  { id: 'region_lagos_mainland', name: 'Lagos Mainland', admin_count: 5, listing_count: 45, critical: 0, growth: '+15%' },
  { id: 'region_lagos_island', name: 'Lagos Island', admin_count: 4, listing_count: 38, critical: 0, growth: '+12%' },
  { id: 'region_minna', name: 'Minna', admin_count: 3, listing_count: 32, critical: 0, growth: '+10%' },
  { id: 'region_bosso', name: 'Bosso', admin_count: 2, listing_count: 18, critical: 1, growth: '+6%' },
  { id: 'region_ibadan', name: 'Ibadan', admin_count: 4, listing_count: 35, critical: 0, growth: '+9%' },
  { id: 'region_ph', name: 'Port Harcourt', admin_count: 3, listing_count: 30, critical: 0, growth: '+11%' },
];

export const ADMIN_MEMBERS: AdminMember[] = [
  { id: 'admin-1', full_name: 'Fatima Bello', role: 'regional_admin', assigned_region_id: 'region_minna', region_name: 'Minna', avatar_initials: 'FB' },
  { id: 'admin-2', full_name: 'Chinedu Obi', role: 'field_admin', assigned_region_id: 'region_bosso', region_name: 'Bosso', avatar_initials: 'CO' },
  { id: 'admin-3', full_name: 'Amara Okafor', role: 'regional_admin', assigned_region_id: 'region_abuja_north', region_name: 'Abuja North', avatar_initials: 'AO' },
  { id: 'admin-4', full_name: 'Tunde Bakare', role: 'field_admin', assigned_region_id: 'region_lagos_mainland', region_name: 'Lagos Mainland', avatar_initials: 'TB' },
  { id: 'admin-5', full_name: 'Ngozi Eze', role: 'regional_admin', assigned_region_id: 'region_lagos_island', region_name: 'Lagos Island', avatar_initials: 'NE' },
  { id: 'admin-6', full_name: 'Segun Adeyemi', role: 'field_admin', assigned_region_id: 'region_ibadan', region_name: 'Ibadan', avatar_initials: 'SA' },
  { id: 'admin-7', full_name: 'Hauwa Mohammed', role: 'regional_admin', assigned_region_id: 'region_ph', region_name: 'Port Harcourt', avatar_initials: 'HM' },
  { id: 'admin-8', full_name: 'Daniel John', role: 'field_admin', assigned_region_id: 'region_abuja_south', region_name: 'Abuja South', avatar_initials: 'DJ' },
];

export const RECENT_ACTIONS: RecentAction[] = [
  { id: 'act-1', title: 'Abuja North Provisioned', subtitle: '2 mins ago • State Admin', icon: 'check_circle', color: 'secondary' },
  { id: 'act-2', title: 'Lagos Mainland Inventory', subtitle: '1 hour ago • Updated', icon: 'upload_file', color: 'primary' },
  { id: 'act-3', title: 'Pending Field Report', subtitle: '3 hours ago • Zone 4', icon: 'warning', color: 'tertiary' },
];
