/**
 * Seeds the LOCAL Supabase stack with realistic test data for UI/UX work.
 *
 *   npm run db:reset   # rebuild schema from supabase/migrations, then seed
 *   npm run db:seed    # seed only (expects a freshly reset database)
 *
 * Image URLs use EXPO_PUBLIC_SUPABASE_URL from .env.local (or SEED_PUBLIC_URL),
 * so they load on a phone on the same Wi-Fi.
 */
import { LOCAL_SEED_PASSWORD, SEED_USERS } from '../../dummy/local-seed-data.ts';
import { seedConversations, seedExtras, seedHouseholds } from './seed-local-activity.ts';
import { seedListings, seedPeople, seedRegionsAndAdmins, type Catalog } from './seed-local-catalog.ts';
import { adminClient, readLocalStack } from './seed-local-helpers.ts';

async function main(): Promise<void> {
  const stack = readLocalStack();
  const db = adminClient(stack);
  console.log(`[Seed] Local API ${stack.apiUrl} · image host ${stack.publicUrl}`);

  const { count, error } = await db.from('listings').select('id', { count: 'exact', head: true });
  if (error) throw new Error(`[Seed] Could not read listings: ${error.message}`);
  if ((count ?? 0) > 0) {
    throw new Error('[Seed] Database already has listings. Run `npm run db:reset` for a clean seed.');
  }

  const users = await seedPeople(db, stack);
  console.log(`[Seed] ${users.size} accounts`);
  const regions = await seedRegionsAndAdmins(db, users);
  const listings = await seedListings(db, stack, users, regions);
  console.log(`[Seed] ${listings.size} listings with photos`);

  const catalog: Catalog = {
    users,
    userNames: new Map(SEED_USERS.map((u) => [u.key, u.fullName])),
    listings,
  };
  const households = await seedHouseholds(db, catalog);
  await seedConversations(db, catalog, households);
  await seedExtras(db, catalog, households);
  console.log(`[Seed] ${households.size} households, chats, tours, reviews, saved listings`);

  console.log(`\nDone. Every account's password: ${LOCAL_SEED_PASSWORD}`);
  for (const u of SEED_USERS) {
    const role = u.admin ? u.admin.role.replace('_', ' ') : u.onboarded ? 'student' : 'student, not onboarded';
    console.log(`  ${u.email.padEnd(20)} ${u.fullName.padEnd(18)} ${role}`);
  }
}

main().catch((error: unknown) => {
  console.error('[Seed] Failed:', error);
  process.exit(1);
});
