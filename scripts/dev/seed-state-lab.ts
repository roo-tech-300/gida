/**
 * Adds the state lab and the slot lab to the LOCAL database without resetting it, so your own
 * test reservations and edits are kept. Each lab is skipped if it is already there.
 *
 *   npm run db:seed:lab
 */
import { labAlreadySeeded, seedSlotLab, seedStateLab, slotLabAlreadySeeded } from './seed-local-lab.ts';
import { lookupExisting } from './seed-local-catalog.ts';
import { adminClient, readLocalStack } from './seed-local-helpers.ts';

async function main(): Promise<void> {
  const stack = readLocalStack();
  const db = adminClient(stack);
  const needState = !(await labAlreadySeeded(db));
  const needSlot = !(await slotLabAlreadySeeded(db));
  if (!needState && !needSlot) {
    console.log('[Seed] Both labs are already in this database. Run `npm run db:reset` to rebuild them from scratch.');
    return;
  }
  const { users, regions } = await lookupExisting(db);
  if (needState) await seedStateLab(db, stack, users, regions);
  if (needSlot) await seedSlotLab(db, stack, users, regions);
  console.log('Done. Sign-in tables: docs/local-dev.md. Slot checks: npm run db:slot-report');
}

main().catch((error: unknown) => {
  console.error('[Seed] Failed:', error);
  process.exit(1);
});
