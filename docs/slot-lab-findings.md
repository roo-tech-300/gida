# Slot lab findings

Produced by `npm run db:slot-report` against the local slot lab (see `docs/local-dev.md`). It checks the data against the rules the app relies on, then tries to break them as real lab students inside transactions that are always rolled back.

## Fixed

### Students could write their own payment data (was: high)
Row-level security let any signed-in student update their own reservation and **any** household, and insert reservations and household memberships freely. A student could mark a reservation paid, create one that started paid, pay ₦5 instead of the rent (the worker charges whatever `amount_paid` says), give themselves a 100-day hold, approve their own household, or join a locked household by writing the membership directly.
- **Now:** `guard_slot_credit_writes` and `guard_pod_writes` triggers (migration `20261122000002`). For an ordinary student, a new reservation must start unpaid, its amount is never below the rent split and its 3-day hold is set by the server, and a student can only ever *end* an unpaid reservation (expire or cancel). A new household always starts waiting for an admin, and students cannot change its approval, room, gender lock or code. Admins, the worker (service role) and direct database sessions are unaffected.
- **Checked by replaying the app's real founder flow as a student:** it still works, and a "cheeky" version of each write is corrected or refused. Tours and location-unlock payments already had tighter policies.

### The gender lock is strict (was: medium)
`join_pod` now refuses a joiner whose profile gender differs from the household's lock, and so does a trigger on `pod_members`, so writing the membership directly no longer bypasses it. A joiner with no gender on their profile is asked to add one. (Migration `20261122000000`.)

### Rent is rounded up to a whole-naira split (was: low)
A student picks a household of 1 to N people and pays rent ÷ size, so the rent must divide evenly by every size from 1 to N: the least common multiple (12 for 4 people, 6 for 3, 60 for 6). Rent is now rounded **up** to that, never down: ₦1,000,000 for 3 people is saved as ₦1,000,002 (₦333,334 each); for 4 people ₦1,000,008.
- Applied in the admin wizard (the roommate-limit step shows "Rent will be saved as …") and enforced by triggers on `listings` and `estates` (migration `20261122000001`), so no client can skip it.
- Existing rents are not changed; they round up the next time they are saved. The report lists them (currently Royal Lodge and Slot · Mixed payments).

### Lapsed holds are released on the server (was: high, and partly misdiagnosed)
I first wrote that nothing expires holds on the server. That was wrong: the worker has a scheduled job (every 2 hours, in `worker/src/index.ts`). It does not run locally, which is why the lab showed lapsed holds that never cleared. Reading it also showed it had two faults: it expired requests still **waiting for an admin**, whose 3-day hold has not started, and one of its two queries filtered on a status that does not exist.
- **Now:** one rule in the database, `expire_lapsed_holds()` (migration `20261122000003`): an unpaid reservation whose hold passed expires, unless its household is still waiting for admin review. It updates each household's member count itself. pg_cron runs it every five minutes (it works locally too); the worker's job now calls the same function.
- Between runs, `get_spots_left` already ignores such holds, and `has_active_booking`, `join_pod` and creating a reservation first release the student's own lapsed hold, so nobody is blocked by a stale row. The property screen also releases a student's own lapsed hold as soon as they look at it.
- Approval now always starts a fresh 3-day hold. Before, a request that waited longer than 3 days for review was already lapsed when approved.

### Earlier fixes from the lab
A cancelled or rejected reservation blocked reserving again (unique index); a student who left a household could not rejoin it; listings showed a price rounded differently from what checkout charges; seeded households recorded the wrong member count. See the git history.

## Open

### 1. A one-unit listing can be reserved twice (medium)
Nothing checks capacity when a household is founded. `Bosso Gate single rooms` has two live reservations for one room. The property screen disables "Reserve" when spots are 0, but a second device or a race gets through. **Fix:** check spots left inside the reservation function, under a lock on the listing.

### 2. Paying after cancelling (low)
If a student starts a Paystack payment, then cancels (or is rejected) before it completes, the worker's confirm step only accepts `booked`, `booked_pending_claim` and `expired` reservations, so the money arrives and nothing is marked paid. **Fix:** decide whether cancel should also void open payment attempts, or the worker should refund.

### 3. Deployment
The worker change (its job now calls `expire_lapsed_holds`) and all migrations are not deployed anywhere. Until then the old worker job keeps expiring requests that are waiting for admin review. pg_cron must be enabled on the hosted project for the five-minute schedule; the migration only warns if it is not.

## UX notes from the screens
- The same action reads "Pay my share" (property bar), "Pay now" (My Home) and "Pay" (household). Pick one.
- The household screen shows a "Gida digital move-in pass" before anyone has paid.
- Hold-based fixtures in the seed (hold running, ending soon) age in real time; re-seed to refresh them.
