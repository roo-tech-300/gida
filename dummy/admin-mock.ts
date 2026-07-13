export type AdminRole = 'super_admin' | 'regional_admin' | 'field_admin' | 'independent_field_admin';

export type AdminMember = {
  id: string;
  full_name: string;
  email: string;
  role: AdminRole;
  assigned_region_id: string | null;
  region_name: string | null;
  jurisdiction: string;
  avatar_initials: string;
  stat_label: string;
  stat_value: string;
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
  { id: 'admin-1', full_name: 'Fatima Bello', email: 'fatima@gida.app', role: 'regional_admin', assigned_region_id: 'region_minna', region_name: 'Minna', jurisdiction: 'Niger State', avatar_initials: 'FB', stat_label: 'Hubs', stat_value: '14' },
  { id: 'admin-2', full_name: 'Chinedu Obi', email: 'chinedu@gida.app', role: 'regional_admin', assigned_region_id: 'region_bosso', region_name: 'Bosso', jurisdiction: 'Minna Metro', avatar_initials: 'CO', stat_label: 'Zones', stat_value: '4' },
  { id: 'admin-3', full_name: 'Amara Okafor', email: 'amara@gida.app', role: 'regional_admin', assigned_region_id: 'region_abuja_north', region_name: 'Abuja North', jurisdiction: 'FCT', avatar_initials: 'AO', stat_label: 'Hubs', stat_value: '9' },
  { id: 'admin-4', full_name: 'Tunde Bakare', email: 'tunde@gida.app', role: 'field_admin', assigned_region_id: 'region_lagos_mainland', region_name: 'Lagos Mainland', jurisdiction: 'Lagos Mainland', avatar_initials: 'TB', stat_label: 'Tasks', stat_value: '28' },
  { id: 'admin-5', full_name: 'Ngozi Eze', email: 'ngozi@gida.app', role: 'regional_admin', assigned_region_id: 'region_lagos_island', region_name: 'Lagos Island', jurisdiction: 'Lagos State', avatar_initials: 'NE', stat_label: 'Hubs', stat_value: '11' },
  { id: 'admin-6', full_name: 'Segun Adeyemi', email: 'segun@gida.app', role: 'field_admin', assigned_region_id: 'region_ibadan', region_name: 'Ibadan', jurisdiction: 'Ibadan North', avatar_initials: 'SA', stat_label: 'Tasks', stat_value: '19' },
  { id: 'admin-7', full_name: 'Hauwa Mohammed', email: 'hauwa@gida.app', role: 'regional_admin', assigned_region_id: 'region_ph', region_name: 'Port Harcourt', jurisdiction: 'Rivers State', avatar_initials: 'HM', stat_label: 'Hubs', stat_value: '7' },
  { id: 'admin-8', full_name: 'Daniel John', email: 'daniel@gida.app', role: 'field_admin', assigned_region_id: 'region_abuja_south', region_name: 'Abuja South', jurisdiction: 'Abuja South', avatar_initials: 'DJ', stat_label: 'Tasks', stat_value: '22' },
];

export type InventoryProperty = {
  id: string;
  name: string;
  location: string;
  region: string;
  layout: string;
  manager: string;
  managerLabel: string;
  bedsFilled: number;
  totalBeds: number;
  status: 'active' | 'fully_booked' | 'inactive';
};

export const INVENTORY: InventoryProperty[] = [
  { id: 'inv-1', name: 'Apex Heights Plaza', location: 'Bosso Metro', region: 'Bosso', layout: '4-Bed Shared Layout', manager: 'Chidi Okafor', managerLabel: 'Field Admin', bedsFilled: 12, totalBeds: 16, status: 'active' },
  { id: 'inv-2', name: 'Main Campus Lodge 2', location: 'GK Area', region: 'Minna', layout: 'Single Self-Contain', manager: 'Musa Ibrahim', managerLabel: 'Regional Admin', bedsFilled: 16, totalBeds: 16, status: 'fully_booked' },
  { id: 'inv-3', name: 'Block B, Bosso Villa', location: 'Bosso Campus', region: 'Bosso', layout: 'Studio Rooms', manager: 'Unassigned', managerLabel: 'Under Inspection Queue', bedsFilled: 0, totalBeds: 8, status: 'inactive' },
  { id: 'inv-4', name: 'Emerald Residence', location: 'Uptown', region: 'Lagos Island', layout: 'Luxury Studios', manager: 'Aisha Yusuf', managerLabel: 'Field Admin', bedsFilled: 4, totalBeds: 4, status: 'fully_booked' },
  { id: 'inv-5', name: 'Heritage Lodge', location: 'Gidan Kwano', region: 'Minna', layout: '2-Bed Executive', manager: 'Fatima Bello', managerLabel: 'Regional Admin', bedsFilled: 3, totalBeds: 6, status: 'active' },
  { id: 'inv-6', name: 'Silver Crest Hostel', location: 'Bosso Town', region: 'Bosso', layout: '3-Bed Standard', manager: 'Tunde Bakare', managerLabel: 'Field Admin', bedsFilled: 2, totalBeds: 10, status: 'active' },
];

export type Landlord = {
  id: string;
  initials: string;
  full_name: string;
  email: string;
  properties_onboarded: number;
  active_leases: number;
  pending_review: number;
};

export const LANDLORDS: Landlord[] = [
  { id: 'll-1', initials: 'AO', full_name: 'Alaric Oakheart', email: 'alaric.o@royalestates.co', properties_onboarded: 14, active_leases: 3, pending_review: 0 },
  { id: 'll-2', initials: 'VK', full_name: 'Valerie Knight', email: 'v.knight@vanguardholdings.com', properties_onboarded: 8, active_leases: 1, pending_review: 0 },
  { id: 'll-3', initials: 'ES', full_name: 'Elias Sterling', email: 'e.sterling@metroliving.io', properties_onboarded: 32, active_leases: 0, pending_review: 5 },
  { id: 'll-4', initials: 'MC', full_name: 'Morgan Chen', email: 'mchen@pacificrentals.net', properties_onboarded: 21, active_leases: 12, pending_review: 0 },
  { id: 'll-5', initials: 'DN', full_name: 'Diana Nwachukwu', email: 'diana@greenleafproperty.com', properties_onboarded: 7, active_leases: 2, pending_review: 1 },
  { id: 'll-6', initials: 'RO', full_name: 'Rashid Ogunlade', email: 'rashid@primehomes.ng', properties_onboarded: 19, active_leases: 8, pending_review: 2 },
];

export const RECENT_ACTIONS: RecentAction[] = [
  { id: 'act-1', title: 'Abuja North Provisioned', subtitle: '2 mins ago • State Admin', icon: 'check_circle', color: 'secondary' },
  { id: 'act-2', title: 'Lagos Mainland Inventory', subtitle: '1 hour ago • Updated', icon: 'upload_file', color: 'primary' },
  { id: 'act-3', title: 'Pending Field Report', subtitle: '3 hours ago • Zone 4', icon: 'warning', color: 'tertiary' },
];
