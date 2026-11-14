/**
 * Adds the state lab and the slot lab to the LOCAL database without resetting it, so your own
 * test reservations and edits are kept. Anything already there is skipped, so a lab that has grown is topped up.
 *
 *   npm run db:seed:lab
 */
import { labAlreadySeeded, missingSlotLabKeys, seedSlotLab, seedStateLab } from './seed-local-lab.ts';
import { lookupExisting } from './seed-local-catalog.ts';
import { adminClient, readLocalStack } from './seed-local-helpers.ts';

async function main(): Promise<void> {
  const stack = readLocalStack();
  const db = adminClient(stack);
  const needState = !(await labAlreadySeeded(db));
  const missingSlot = await missingSlotLabKeys(db);
  if (!needState && missingSlot.size === 0) {
    console.log('[Seed] Both labs are already in this database. Run `npm run db:reset` to rebuild them from scratch.');
    return;
  }
  const { users, regions } = await lookupExisting(db);
  if (needState) await seedStateLab(db, stack, users, regions);
  if (missingSlot.size > 0) await seedSlotLab(db, stack, users, regions, missingSlot);
  console.log('Done. Sign-in tables: docs/local-dev.md. Slot checks: npm run db:slot-report');
}

main().catch((error: unknown) => {
  console.error('[Seed] Failed:', error);
  process.exit(1);
});
