export type AdminRole = 'super_admin' | 'regional_admin' | 'field_admin';

export type AdminRegion = {
  id: string;
  name: string;
  parent_region_id: string | null;
  path: string[];
};

export type AdminMember = {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: AdminRole;
  assigned_region_id: string | null;
  region_name: string | null;
  supervisor_id: string | null;
  supervisor_name: string | null;
};

export type AdminCandidate = {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
};
