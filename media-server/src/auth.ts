import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from './http-error.ts';

type AdminRole = 'super_admin' | 'regional_admin' | string;

export interface AdminProfile {
  id: string;
  role: AdminRole;
  assigned_region_id: string | null;
}

export interface ListingAccess {
  id: string;
  admin_id: string | null;
  region_path: string[] | null;
}

/**
 * Mirrors can_manage_listing() in SQL: super admins manage everything, an admin
 * manages listings they own, and regional admins manage listings in their region.
 */
export function canManageListing(admin: AdminProfile, listing: ListingAccess): boolean {
  if (admin.role === 'super_admin') return true;
  if (listing.admin_id === admin.id) return true;
  if (admin.role === 'regional_admin' && admin.assigned_region_id) {
    return (listing.region_path ?? []).includes(admin.assigned_region_id);
  }
  return false;
}

export function bearerToken(headers: Headers): string {
  const header = headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new HttpError(401, 'Missing bearer token');
  }
  return token;
}

const TOKEN_CACHE_MS = 60_000;

export class AdminAuth {
  private readonly db: SupabaseClient;
  // A tus upload sends many PATCH requests with the same token; avoid an auth
  // round trip to Supabase for each chunk.
  private readonly cache = new Map<string, { admin: AdminProfile; expiresAt: number }>();

  constructor(db: SupabaseClient) {
    this.db = db;
  }

  async requireAdmin(headers: Headers): Promise<AdminProfile> {
    const token = bearerToken(headers);
    const cached = this.cache.get(token);
    if (cached && cached.expiresAt > Date.now()) return cached.admin;

    const { data, error } = await this.db.auth.getUser(token);
    if (error || !data.user) throw new HttpError(401, 'Invalid or expired session');

    const { data: profile, error: profileError } = await this.db
      .from('admin_profiles')
      .select('id, role, assigned_region_id')
      .eq('id', data.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new HttpError(403, 'Only admins can manage listing videos');

    const admin = profile as AdminProfile;
    this.pruneCache();
    this.cache.set(token, { admin, expiresAt: Date.now() + TOKEN_CACHE_MS });
    return admin;
  }

  async requireListingAccess(admin: AdminProfile, listingId: string): Promise<void> {
    const { data, error } = await this.db
      .from('listings')
      .select('id, admin_id, region_path')
      .eq('id', listingId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'Listing not found');
    if (!canManageListing(admin, data as ListingAccess)) {
      throw new HttpError(403, 'You cannot manage videos for this listing');
    }
  }

  private pruneCache(): void {
    const now = Date.now();
    for (const [token, entry] of this.cache) {
      if (entry.expiresAt <= now) this.cache.delete(token);
    }
  }
}
