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

### A place can no longer be over-booked, and a solo buyout takes the whole place (was: medium)
A listing has `units_available` identical units and **every household occupies one whole unit**: a "just me" reservation of a 3-person flat pays the full rent and takes the flat. Capacity was counted per reservation, so a second household could be started on a one-unit listing (Bosso Gate had two), and a solo buyout still showed "2 spots left".
- **Now** (migration `20261123000000`): starting a household needs a free unit. It is checked when the household is created and again when its first member is added, under a lock per listing, so two students starting one at the same moment cannot both win. Spots left = seats still open inside existing households + the full capacity of each free unit.
- **Checked with a real race:** two students starting a household on the same one-unit listing at once, three times. Exactly one got the place each time; the other was told "This place is fully booked." and their orphan reservation was cancelled. The app now shows that message and cleans up.
- Existing over-booked data is not touched: Bosso Gate still has two households on one unit, and the report lists it.

### Invites, seat clocks and the two limits
Friends are invited by link (migration `20261124000000`). A link holds a **ghost seat** for 2 hours, counted against capacity and spots left; a friend who joins has **24 hours** to pay; a student can hold **one unpaid spot at a time**, and two lapsed holds in a day pause reserving. Links are revoked when the founder cancels or lapses, or the household is rejected. The slot report probes each of these. A friend who already has a Gida account taps "Sign in" on the invite (or is offered it when their email is taken), signs in, and is returned to the invite; a student who never finished onboarding is sent to finish it and brought back.

### The "join an open group" list shows real seats
The list counted every membership row, so a household with cancelled, lapsed or rejected members looked fuller than it was, and it knew nothing about seats held for invite links, so a join could be refused with "This group is already full". `get_pod_seat_counts` (migration `20261125000000`) now says who still holds a seat and how many seats links hold; the list, its cards and the detail view use it, and a household nobody holds a seat in is no longer listed. The list also respects the household's gender lock, so students are not offered a household they would be refused.

### Earlier fixes from the lab
A cancelled or rejected reservation blocked reserving again (unique index); a student who left a household could not rejoin it; listings showed a price rounded differently from what checkout charges; seeded households recorded the wrong member count. See the git history.

## Open

### 1. Paying after cancelling (low)
If a student starts a Paystack payment, then cancels (or is rejected) before it completes, the worker's confirm step only accepts `booked`, `booked_pending_claim` and `expired` reservations, so the money arrives and nothing is marked paid. **Fix:** decide whether cancel should also void open payment attempts, or the worker should refund.

### 2. Deployment
The worker change (its job now calls `expire_lapsed_holds`) and all migrations are not deployed anywhere. Until then the old worker job keeps expiring requests that are waiting for admin review. pg_cron must be enabled on the hosted project for the five-minute schedule; the migration only warns if it is not.

## UX notes from the screens
- The same action reads "Pay my share" (property bar), "Pay now" (My Home) and "Pay" (household). Pick one.
- The household screen shows a "Gida digital move-in pass" before anyone has paid.
- Hold-based fixtures in the seed (hold running, ending soon) age in real time; re-seed to refresh them.
