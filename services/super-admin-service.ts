import { supabase } from '@/lib/supabase';
import { fetchAdminProfiles, fetchRegions } from '@/services/adminService';
import type { AdminRole } from '@/types/admin';

export type SuperAdminStats = {
  totalRegions: number;
  regionalAdmins: number;
  fieldAdmins: number;
};

export async function fetchSuperAdminStats(): Promise<SuperAdminStats> {
  const [regions, admins] = await Promise.all([fetchRegions(), fetchAdminProfiles()]);

  return {
    totalRegions: regions.length,
    regionalAdmins: admins.filter((member) => member.role === 'regional_admin').length,
    fieldAdmins: admins.filter((member) => member.role === 'field_admin').length,
  };
}

export type AdminActivityIcon = 'check_circle' | 'upload_file' | 'warning';
export type AdminActivityColor = 'secondary' | 'primary' | 'tertiary';

export type AdminActivity = {
  id: string;
  title: string;
  subtitle: string;
  icon: AdminActivityIcon;
  color: AdminActivityColor;
};

type RecentAdminRow = {
  id: string;
  role: AdminRole;
  updated_at: string;
  profile: { full_name: string | null } | null;
  region: { name: string } | null;
};

type RecentListingRow = {
  id: string;
  title: string;
  city: string | null;
  created_at: string;
};

type ActivityEntry = {
  timestamp: string;
  activity: AdminActivity;
};

const ROLE_ACTION_LABEL: Record<AdminRole, string> = {
  super_admin: 'promoted to Super Admin',
  regional_admin: 'promoted to Regional Admin',
  field_admin: 'promoted to Field Admin',
};

function timeAgo(timestamp: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export async function fetchRecentAdminActivity(limit = 5): Promise<AdminActivity[]> {
  const [adminsResult, listingsResult] = await Promise.all([
    supabase
      .from('admin_profiles')
      .select('id, role, updated_at, profile:profiles(full_name), region:regions(name)')
      .order('updated_at', { ascending: false })
      .limit(limit),
    supabase
      .from('listings')
      .select('id, title, city, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  if (adminsResult.error) {
    console.error('[SuperAdminService] Failed to fetch recent admin activity:', adminsResult.error.message);
  }
  if (listingsResult.error) {
    console.error('[SuperAdminService] Failed to fetch recent listing activity:', listingsResult.error.message);
  }

  const entries: ActivityEntry[] = [];

  for (const row of (adminsResult.data ?? []) as unknown as RecentAdminRow[]) {
    entries.push({
      timestamp: row.updated_at,
      activity: {
        id: `admin-${row.id}`,
        title: `${row.profile?.full_name ?? 'An admin'} ${ROLE_ACTION_LABEL[row.role]}`,
        subtitle: `${row.region?.name ?? 'No region'} • ${timeAgo(row.updated_at)}`,
        icon: 'check_circle',
        color: 'secondary',
      },
    });
  }

  for (const row of (listingsResult.data ?? []) as unknown as RecentListingRow[]) {
    entries.push({
      timestamp: row.created_at,
      activity: {
        id: `listing-${row.id}`,
        title: 'New listing published',
        subtitle: `${row.city ?? 'Unknown city'} • ${timeAgo(row.created_at)}`,
        icon: 'upload_file',
        color: 'primary',
      },
    });
  }

  return entries
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
    .map((entry) => entry.activity);
}
