/**
 * Seeds people and places: accounts + profiles, regions, admins, landlords,
 * listings (with matching estates, as the app creates them) and photos.
 */
import { execFileSync } from 'node:child_process';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  LOCAL_SEED_PASSWORD, SEED_LANDLORDS, SEED_LISTINGS, SEED_REGIONS, SEED_USERS,
  type SeedListing, type SeedRegionKey,
} from '../../dummy/local-seed-data.ts';
import { ensureUser, must, uploadImage, type LocalStack } from './seed-local-helpers.ts';

export interface SeededListing {
  id: string;
  estateId: string;
  title: string;
  image: string;
  location: string;
  priceTotal: number;
  propertyTier: number;
}

export interface Catalog {
  users: Map<string, string>;
  userNames: Map<string, string>;
  listings: Map<string, SeededListing>;
}

const ENTRY_YEAR_NOW = 2026;

export async function seedPeople(db: SupabaseClient, stack: LocalStack): Promise<Map<string, string>> {
  const users = new Map<string, string>();
  for (const u of SEED_USERS) {
    const id = await ensureUser(db, u, LOCAL_SEED_PASSWORD);
    users.set(u.key, id);
    const avatarUrl = u.avatar ? await uploadImage(db, stack, 'avatars', u.avatar) : null;
    must(`profile ${u.email}`, await db.from('profiles').update({
      full_name: u.fullName,
      username: u.username,
      gender: u.gender,
      onboarded: u.onboarded,
      avatar_url: avatarUrl,
      bio: u.bio ?? null,
      religion: u.religion ?? null,
      school: u.school ?? null,
      city: 'Minna',
      campus: u.school ? 'Bosso' : null,
      is_student: !u.admin,
      is_admin: !!u.admin,
      show_in_roommate_feed: !!u.inRoommateFeed,
      entry_year: u.level ? ENTRY_YEAR_NOW - u.level / 100 + 1 : null,
    }).eq('id', id).select('id'));

    if (u.living) {
      must(`living prefs ${u.email}`, await db.from('living_preferences').upsert({
        profile_id: id, min_budget: u.living.minBudget, max_budget: u.living.maxBudget,
        preferred_area: u.living.area, preferred_layout: u.living.layout,
      }).select('profile_id'));
    }
    if (u.roommate) {
      must(`roommate prefs ${u.email}`, await db.from('roommate_preferences').upsert({
        profile_id: id, sleep_schedule: u.roommate.sleep, cleanliness_level: u.roommate.cleanliness,
        guest_policy: u.roommate.guests, study_habitat: u.roommate.study, personality_vibe: u.roommate.personality,
      }).select('profile_id'));
    }
  }
  return users;
}

export async function seedRegionsAndAdmins(db: SupabaseClient, users: Map<string, string>): Promise<Map<SeedRegionKey, string>> {
  const regions = new Map<SeedRegionKey, string>();
  const createdBy = users.get('super');
  for (const r of SEED_REGIONS) {
    const row = must(`region ${r.name}`, await db.from('regions').insert({
      name: r.name, created_by: createdBy, parent_region_id: r.parent ? regions.get(r.parent) : null,
    }).select('id').single());
    regions.set(r.key, row.id as string);
  }
  for (const u of SEED_USERS) {
    if (!u.admin) continue;
    must(`admin ${u.email}`, await db.from('admin_profiles').upsert({
      id: users.get(u.key), role: u.admin.role, assigned_region_id: regions.get(u.admin.region),
    }).select('id'));
  }
  return regions;
}

function amenityColumns(l: SeedListing): Record<string, boolean> {
  const a = l.amenities;
  return {
    has_borehole: !!a.borehole, has_generator: !!a.generator, has_fenced_gate: !!a.fencedGate,
    has_internet: !!a.internet, has_burglary: !!a.burglary, has_cabinet: !!a.cabinet,
    has_wardrobe: !!a.wardrobe, is_shared_kitchen: !!a.sharedKitchen, is_shared_bathroom: !!a.sharedBathroom,
  };
}

export async function seedListings(
  db: SupabaseClient, stack: LocalStack, users: Map<string, string>, regions: Map<SeedRegionKey, string>,
): Promise<Map<string, SeededListing>> {
  const landlords = new Map<string, string>();
  for (const ll of SEED_LANDLORDS) {
    const row = must(`landlord ${ll.fullName}`, await db.from('landlords').insert({
      full_name: ll.fullName, phone_number: ll.phone, email: ll.email,
    }).select('id').single());
    landlords.set(ll.key, row.id as string);
  }

  const listings = new Map<string, SeededListing>();
  for (const l of SEED_LISTINGS) {
    const photoUrls: string[] = [];
    for (const p of l.photos) photoUrls.push(await uploadImage(db, stack, 'listing-images', p));
    const tier = l.maxRoommates;

    const estate = must(`estate ${l.title}`, await db.from('estates').insert({
      name: l.title, description: l.description, campus: l.campus, property_tier: tier,
      price_per_annum: l.priceTotal, physical_rooms_inventory: 1, abstract_slots_available: tier,
      primary_image: photoUrls[0], rules: l.rules, amenities: l.features,
    }).select('id').single());

    const listing = must(`listing ${l.title}`, await db.from('listings').insert({
      title: l.title, description: l.description, category: 'student_housing', status: 'available',
      featured: !!l.featured, price_amount: l.priceTotal, slashed_price: l.slashedPrice ?? null,
      lease_term: 'per_annum', layout_type: l.layout, units_available: 1,
      number_of_bedrooms: l.bedrooms, number_of_bathrooms: l.bathrooms, max_roommates: l.maxRoommates,
      property_tier: tier, abstract_slots_available: tier, location_landmark: l.landmark, city: 'Minna',
      campus: l.campus, latitude: l.lat, longitude: l.lng, custom_features: l.features, rules: l.rules,
      primary_image: photoUrls[0], admin_id: users.get(l.admin), landlord_id: landlords.get(l.landlord),
      estate_id: estate.id, region_path: [regions.get(l.region)], ...amenityColumns(l),
    }).select('id').single());

    must(`photos ${l.title}`, await db.from('listing_photos').insert(
      photoUrls.map((url, i) => ({ listing_id: listing.id, image_url: url, display_order: i })),
    ).select('id'));

    listings.set(l.key, {
      id: listing.id as string, estateId: estate.id as string, title: l.title, image: photoUrls[0],
      location: `${l.landmark}, Minna`, priceTotal: l.priceTotal, propertyTier: tier,
    });
  }

  refreshRegionPaths();
  return listings;
}

/**
 * refresh_region_hierarchy() has UPDATEs without WHERE, which pg_safeupdate blocks for
 * API callers (production too). Run it as postgres inside the local DB container instead.
 */
function refreshRegionPaths(): void {
  try {
    execFileSync('docker', ['exec', 'supabase_db_gida', 'psql', '-U', 'postgres', '-qtAc', 'select public.refresh_region_hierarchy();'], { stdio: 'pipe' });
  } catch (error) {
    console.error('[Seed] refresh_region_hierarchy failed (region paths may be stale):', error);
  }
}
