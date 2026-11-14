/**
 * Adds the "state lab" (dummy/local-seed-lab.ts) on top of an existing seeded database.
 * Used by the full seed, and by `npm run db:seed:lab` to add it without a reset.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { LAB_HOUSEHOLDS, LAB_LISTINGS, LAB_REVIEWS, LAB_USERS } from '../../dummy/local-seed-lab.ts';
import type { SeedRegionKey } from '../../dummy/local-seed-data.ts';
import { seedExtras, seedHouseholds } from './seed-local-activity.ts';
import { seedListings, seedPeople, type Catalog } from './seed-local-catalog.ts';
import { must, type LocalStack } from './seed-local-helpers.ts';

export async function labAlreadySeeded(db: SupabaseClient): Promise<boolean> {
  const rows = must('lab lookup', await db.from('listings').select('id').like('title', 'Lab · %').limit(1));
  return rows.length > 0;
}

export async function seedStateLab(
  db: SupabaseClient, stack: LocalStack, users: Map<string, string>, regions: Map<SeedRegionKey, string>,
): Promise<void> {
  const labUsers = await seedPeople(db, stack, LAB_USERS);
  const allUsers = new Map([...users, ...labUsers]);
  const listings = await seedListings(db, stack, allUsers, regions, LAB_LISTINGS);

  const catalog: Catalog = {
    users: allUsers,
    userNames: new Map(LAB_USERS.map((u) => [u.key, u.fullName])),
    listings,
  };
  const households = await seedHouseholds(db, catalog, LAB_HOUSEHOLDS);
  await seedExtras(db, catalog, households, { tours: [], reviews: LAB_REVIEWS, saved: [] });
  console.log(`[Seed] State lab: ${listings.size} listings, ${labUsers.size} accounts, ${households.size} reservations`);
}
