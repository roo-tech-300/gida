# Local development backend

A full copy of the production database **schema** (no production data) runs in Docker on this machine. Seeded test accounts and listings cover every state of the UX redesign.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run db:start` | Start the local Supabase stack (Postgres, Auth, Storage, Realtime, Studio) |
| `npm run db:reset` | Rebuild the database from `supabase/migrations/` and re-seed it |
| `npm run db:seed` | Seed only (expects an empty, freshly reset database) |
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

## Where the schema came from

`supabase/migrations/20261111000000_baseline_from_hosted.sql` was generated on 2026-11-11 from the hosted project's system catalogs (tables, functions, triggers, RLS policies, storage buckets, realtime). It contains no rows. Two production webhook triggers were left out on purpose: they call hosted edge functions and one carries a shared secret, so local data must never fire them.

Production was built by running SQL in the dashboard, so it has no migration history. The older scripts in `sql/` and `sql/applied-migrations/` are a record of what was applied there; the baseline already includes them.

When production changes, regenerate the baseline rather than hand-editing it.
