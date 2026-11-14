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
| `ada@gida.test` | Ada, student | In an approved 4-person household at Royal Lodge, her ₦250,000 share unpaid, hold ends in about 2 days |
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

Run `npm run db:slot-report` to read it all back. It checks the data against the rules (household counts, capacity, lapsed holds, rent splits, rooms, invites) and runs behaviour probes as real lab students (joining full or locked households, re-reserving after cancelling, self-marking as paid, pay-link states). The probes run inside transactions that are always rolled back, so nothing changes. Current results and recommended fixes are in `docs/slot-lab-findings.md`.

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
