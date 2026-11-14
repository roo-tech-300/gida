# Local development backend

A full copy of the production database **schema** (no production data) runs in Docker on this machine. Seeded test accounts and listings cover every state of the UX redesign.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run db:start` | Start the local Supabase stack (Postgres, Auth, Storage, Realtime, Studio) |
| `npm run db:reset` | Rebuild the database from `supabase/migrations/` and re-seed it |
| `npm run db:seed` | Seed only (expects an empty, freshly reset database) |
| `npm run db:seed:lab` | Add the state lab (below) to the current database without a reset, keeping your own test data |
| `npm run db:status` | Show local URLs and keys |
| `npm run db:stop` | Stop the stack (data is kept until the next reset) |
| `npx expo start` | Run the app; it reads `.env.local` and talks to the local stack |

Studio (a database browser) runs at <http://127.0.0.1:54323>. Email from Auth goes to Mailpit at <http://127.0.0.1:54324>.

## How the app finds the backend

`.env.local` (gitignored) points the app at `http://<this machine's LAN IP>:54321`, so a phone on the same Wi-Fi can reach it. If the IP changes, update `EXPO_PUBLIC_SUPABASE_URL` there and run `npm run db:reset` so image URLs match. A firewall on this machine must allow port 54321.

`EXPO_PUBLIC_WORKER_URL` is empty, so payments use the app's built-in **simulated** mode: no Paystack calls are made.

## Test accounts

Every account uses the password `GidaDev!2026`.

| Email | Who | State to test |
|---|---|---|
| `ada@gida.test` | Ada, student | In an approved 4-person household at Royal Lodge, her share unpaid (₦300,000 on a fresh seed), hold ends in about 2 days |
| `amina@gida.test` | Amina, student | Same household, already paid |
| `zainab@gida.test` | Zainab, student | Solo request at Gidan Kwano Haven waiting for admin review |
| `fatima@gida.test` | Fatima, student | Invited into Ada's household; tour booked for tomorrow |
| `tobi@gida.test` | Tobi, student | Solo booking at Prime Lodge, paid; has left a review |
| `chidi@gida.test` | Chidi, student | Reservation at Talba Court expired |
| `new@gida.test` | Kemi, student | Has not finished onboarding |
| `field@gida.test` | Musa, field admin (Bosso) | Receives the reservation chats; owns most listings |
| `regional@gida.test` | Ibrahim, regional admin (Minna) | |
| `super@gida.test` | Ngozi, super admin | |

Seed data lives in `dummy/local-seed-data.ts`; the runner is `scripts/dev/seed-local.ts`. Images come from `dummy/images/`.

## State lab

Ten extra listings named `Lab · …`, each built to exercise one data case the property screen has to handle, plus nine accounts (`lab.pay@gida.test`, …) that only ever hold lab reservations. Run `npm run db:seed:lab` to add it to an existing database; a full `db:reset` includes it.

| Listing | Sign in as | What it checks |
|---|---|---|
| Bare minimum | `ada@gida.test` | No description, rules, amenities or map location (tour card hidden), one photo, one fact |
| Fully loaded… (very long name) | `ada@gida.test` | 6 photos, all 9 amenities, long text and address, 5 rules, four facts, 4 reviews (cap of 2 + "View all"), plenty of spots, whole-place price |
| No photos | `ada@gida.test` | Hero empty state, no photo grid |
| Two photos | `ada@gida.test` | Photo grid with two tiles |
| One spot left | `ada@gida.test` | "1 spot left" chip on a shared flat |
| Pay: hold running | `lab.pay@gida.test` | "Pay my share", hold countdown in hours, cancel link |
| Pay: solo, hold ending | `lab.solo@gida.test` | "Pay now", "Hold ends within the hour" |
| Pay: hold ended | `lab.late@gida.test` | "Hold has ended" |
| Request not approved | `lab.rej@gida.test` | Rejected request: "Find another place" |
| Cancelled request | `lab.can@gida.test` | A cancelled reservation can be reserved again |

Existing demo accounts cover the rest: under review with a cancel button (`sani@` at Bosso Gate, `halima@` at GK Twin Rooms), paid household (`amina@` at Royal Lodge; `ada@` too once her share is paid), paid solo (`tobi@`), invited (`fatima@`), expired (`chidi@`), and a full listing (Gidan Kwano Haven).

Not covered locally: video tours. They need `EXPO_PUBLIC_MEDIA_CDN_URL` and encoded video files, which the local stack does not have.

## Slot lab

The state lab above is about what a screen looks like. The slot lab is about the **household and reservation data underneath**: 11 `Slot · …` listings, 16 `slot.*@gida.test` accounts and 16 households, shaped to stress the rules the app relies on. `npm run db:seed:lab` adds it (a full `db:reset` includes it).

| Listing | What the data holds |
|---|---|
| Forming, 1 of 4 | One founder, three places open, one pending invite |
| Mixed payments, 3 of 4 | One paid, two unpaid with holds at 30h and 5h |
| Full and paid, room assigned | Four paid members, finalized, door B4 |
| Lapsed hold still counted | One paid, one unpaid whose hold ended 6h ago |
| Cancelled and expired members | Paid, cancelled, expired and unpaid members in one household |
| Two households, two units | One full and paid, one half-formed, on the same listing |
| Odd split, fractional share | ₦1,000,000 over 3 people = ₦333,333.33 each |
| Gender-locked household | A household locked to men |
| Invitations | Pending, declined and accepted invites |
| Admin queue ages | Four pending requests waiting 0.2h, 5h, 30h and 70h (sign in as `field@gida.test`, Today) |
| Parent pay links | Open, expired, revoked and paid links |
| Solo buyout of a 3-person flat | One person paid the whole rent: the place shows no spots left |

Run `npm run db:slot-report` to read it all back. It checks the data against the rules (household counts, capacity, lapsed holds, rent splits, rooms, invites) and runs behaviour probes as real lab students (joining full or locked households, re-reserving after cancelling, self-marking as paid, pay-link states). The probes run inside transactions that are always rolled back, so nothing changes. Current results and recommended fixes are in `docs/slot-lab-findings.md`.

## Rules the database now enforces

- **Rent rounding:** rent is rounded up so every household size from 1 to the room limit pays whole naira (a multiple of 12 for 4 people). Entering ₦1,000,000 for a 4-person place saves ₦1,000,008.
- **Student writes:** a student cannot mark a reservation paid, change its amount or hold, or approve a household. Use an admin account or the worker for those.
- **Lapsed holds:** an approved, unpaid hold expires by itself (pg_cron every 5 minutes, also locally). To sweep now: `select public.expire_lapsed_holds();`.
- **Capacity:** every household takes one whole unit of a listing, so a place with one unit can only ever have one household. Starting another is refused with "This place is fully booked."
- **Gender lock:** a household locked to men or women only admits that gender.

## Invite links

A founder invites each friend with a link, not a code. Try it:
1. Sign in as `slot.01@gida.test` (founder of Slot · Forming, 1 of 4) and open `/property/invite?podId=<pod id>&creditId=<credit id>`, or the household screen's "Invite friends with a link" button. Tap "Invite a friend": a link is made and the share sheet opens (in a desktop browser the link is shown in a message instead).
2. Open the link signed out (a private window). The page shows the place, the friend's share and who has joined. "Join and pay" asks for name, email, gender and school, creates the account, takes the seat and opens the payment screen.
3. The new student's My Home shows a "Choose a password" card until they set one.
4. A friend who already has an account taps "Sign in" on the invite page and returns to it afterwards. Try it with `slot.06@gida.test`. Only invite links are remembered for the return trip (`lib/pending-redirect.ts`), so the sign-in screen cannot be used to send anyone elsewhere.

Rules, all enforced in the database:
- A link holds a seat for **2 hours** (a "ghost seat"), then the seat opens again; the link keeps working for **48 hours** until used. One link, one seat.
- A friend who joins (by link or by code) has **24 hours** to pay.
- A student holds **one unpaid spot at a time**, and two holds that ran out in a day pause new reservations for a day.
- Links stop working when their founder cancels or lapses, or the household is rejected.
- A founder can create at most about twice the number of open seats in links per day.

Set `EXPO_PUBLIC_PAY_PAGE_ORIGIN` to the site's address so links shared from a phone point at the right place (on the web the page's own address is used). For production, **email confirmation must be off** in Supabase Auth for the account to be usable straight away; if it is on, the friend is told to confirm their email and open the link again.

## Trying payments end to end

Real payments are never made locally. To click through (or script) one against the real worker code:
1. `npm run dev:worker` (port 8787, reads `worker/.dev.vars`; set `PAYSTACK_BASE_URL=http://127.0.0.1:4010`).
2. `FAKE_PUBLIC_HOST=127.0.0.1 npm run dev:paystack` (port 4010). It has a checkout page, sends the signed webhook, and accepts refund requests (it logs `refund requested`).
3. Start a payment with `POST /api/paystack/initialize` (`kind: lodge`, the reservation's `slotCreditId`) and finish it with `POST :4010/complete/<reference>`.

Things to try: pay normally; start a payment, then reject the household (`update pods set verification_status='rejected' …`) and finish it, which refunds it; start a payment for a cancelled reservation, which is refused. While a payment is in progress (30 minutes) a student cannot cancel that reservation.

## Cancelling a reservation

A student can cancel an **unpaid** reservation (under review, or approved but unpaid) from the property screen or My Home. It becomes `cancelled`, separate from `expired` (the hold lapsed), and frees the spot. Paid reservations cannot be cancelled in the app. Test: sign in as `sani@gida.test`, open Bosso Gate single rooms, tap "Cancel request".

## Where the schema came from

`supabase/migrations/20261111000000_baseline_from_hosted.sql` was generated on 2026-11-11 from the hosted project's system catalogs (tables, functions, triggers, RLS policies, storage buckets, realtime). It contains no rows. Two production webhook triggers were left out on purpose: they call hosted edge functions and one carries a shared secret, so local data must never fire them.

Production was built by running SQL in the dashboard, so it has no migration history. The older scripts in `docs/legacy-sql/` are a record of what was applied there; the baseline already includes them.

When production changes, regenerate the baseline rather than hand-editing it.

## Payments locally (parent pay link)

Real Paystack is never called locally. Two extra processes stand in for it:

| Process | Command | Port |
|---|---|---|
| Worker (the real worker code, run by wrangler) | `npm run dev:worker` | 8787 |
| Fake Paystack (checkout page + signed webhook) | `npm run dev:paystack` | 4010 |

1. Create `worker/.dev.vars` (gitignored) with `SUPABASE_URL=http://127.0.0.1:54321`, the local `SUPABASE_SERVICE_ROLE_KEY`
   (`npx supabase status -o env`), `PAYSTACK_SECRET_KEY=sk_test_local_only`, `PAYSTACK_BASE_URL=http://127.0.0.1:4010`
   and `PAY_PAGE_ORIGIN=http://<your LAN ip>:8081`.
2. Set `EXPO_PUBLIC_WORKER_URL=http://<your LAN ip>:8787` in `.env.local` and restart Expo.
3. Sign in as `ada@gida.test`, open My Home, tap **Send to a parent**. On web without a share sheet the message is copied;
   the link is also in the `payment_links` table. Open it in a private window (no login), enter any email, pay on the fake
   checkout, and watch Ada's My Home update.

Leaving `EXPO_PUBLIC_WORKER_URL` empty keeps the old simulated student checkout and disables the parent page.
