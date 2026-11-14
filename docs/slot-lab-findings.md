# Slot lab findings

Produced by `npm run db:slot-report` against the local slot lab (see `docs/local-dev.md`). Each item says what the data showed, why it matters to a student or admin, and the fix I recommend. Items 1 to 5 are open and need a decision; the last section lists what the lab already led me to fix.

## Open

### 1. Nothing releases a hold that has run out (high)
A student's hold lasts 3 days, but only the student's own phone marks it `expired`, and only when they open the pay screen. A student who never comes back keeps the spot forever.
- **What a student sees:** a listing says "Full" when a hold on it lapsed days ago; the student who lost the hold sees "Hold has ended" next to a "Pay my share" button; trying to reserve again says they already have a reservation.
- **Evidence:** `Slot · Lapsed hold still counted` (spots show 0, should be 1) and `Lab · Pay: hold ended`. `get_payment_link` already treats a passed deadline as expired, but `get_spots_left`, `has_active_booking` and the unique index do not.
- **Fix:** a scheduled `expire_lapsed_holds()` (pg_cron, hourly) that sets unpaid, past-deadline reservations to `expired` and reconciles the household; plus excluding them in `get_spots_left` so the count is right between runs. The unique index cannot use the clock, so the sweep is what unblocks re-reserving.

### 2. A student can mark their own reservation as paid (high, before launch)
The row-level-security policy `slot_credits_update_own` lets a student update any column of their own reservation. The probe sets `status = 'paid_unmatched'` without paying and it succeeds.
- **Fix:** remove the student update policy and move the few legitimate changes (cancel, expire) into functions, which already exist for cancel. Payment confirmation should only ever come from the worker.

### 3. A one-unit listing can be reserved twice (medium)
Nothing checks capacity when a household is founded. `Bosso Gate single rooms` has two live reservations for one room.
- **Fix:** check spots left inside the reservation function, under a lock on the listing, and refuse with a friendly message. The details screen already disables "Reserve" when spots are 0, but a second device or a race gets through.

### 4. The gender lock on a household is not enforced (medium)
`join_pod` never compares the joiner's gender with `pods.matched_gender`; a woman joined a household locked to men in the probe.
- **Fix:** check it in `join_pod`. Confirm first that the lock is meant to be strict.

### 5. Rent that does not divide evenly leaves a kobo gap (low)
₦1,000,000 over 3 people is ₦333,333.33 each; the three shares total ₦999,999.99. Separately, the code had three rounding rules (listing display rounded to the naira, household shares to the kobo, separate billing rounded up).
- **Decide:** who absorbs the kobo (the platform, or the last payer), or require rents that divide evenly by the tier. The display mismatch is fixed (below).

### UX notes from the screens
- The same action reads "Pay my share" (property bar), "Pay now" (My Home) and "Pay" (household). Pick one.
- The household screen shows a "Gida digital move-in pass" before anyone has paid.

## Already fixed because of the lab
- A cancelled or rejected reservation blocked the student from reserving the place again (a unique index only ignored `expired`). Fixed in `20261121000002`.
- A student who left a household could not join the same one again (`join_pod` always inserted a membership row). Fixed in `20261121000003`.
- The listing page showed ₦333,333 while checkout charges ₦333,333.33. Listings now use the same kobo-precise split, and the bottom bar shows the reservation's own locked amount.
- Seeded households recorded the wrong member count when someone had expired or cancelled.
