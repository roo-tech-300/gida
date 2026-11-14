/**
 * Adds the state lab to the LOCAL database without resetting it, so your own test
 * reservations and edits are kept:
 *
 *   npm run db:seed:lab
 */
import { labAlreadySeeded, seedStateLab } from './seed-local-lab.ts';
import { lookupExisting } from './seed-local-catalog.ts';
import { adminClient, readLocalStack } from './seed-local-helpers.ts';

async function main(): Promise<void> {
  const stack = readLocalStack();
  const db = adminClient(stack);
  if (await labAlreadySeeded(db)) {
    console.log('[Seed] The state lab is already in this database. Run `npm run db:reset` to rebuild it from scratch.');
    return;
  }
  const { users, regions } = await lookupExisting(db);
  await seedStateLab(db, stack, users, regions);
  console.log('Done. Sign-in table: docs/local-dev.md ("State lab").');
}

main().catch((error: unknown) => {
  console.error('[Seed] Failed:', error);
  process.exit(1);
});
