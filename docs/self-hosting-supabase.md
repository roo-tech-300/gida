# Plan: self-hosting Supabase on your VPS

Status: plan only. Nothing here has been run, and no production system has been touched.

## 1. What Gida actually uses from Supabase

This is the whole surface to host. It is small, which makes self-hosting realistic.

| Piece | How Gida uses it | Self-hosted equivalent |
|---|---|---|
| Postgres 17 | ~40 tables, RLS everywhere, many `security definer` functions, triggers on `auth.users` (`handle_new_user`) | Same image the CLI uses locally (`supabase/postgres`) |
| Auth | Email + password only (`signUp`, `signInWithPassword`). No OAuth, no phone | GoTrue container + an SMTP service |
| Storage | Three public buckets: `avatars`, `listing-images`, `place-photos` | Storage API container, files on disk (or S3-compatible) |
| Realtime | `conversations`, `messages`, `tour_bookings`, `household_messages` | Realtime container |
| Edge function | `send-message-push` (FCM push when a message is inserted) | Edge Runtime container |
| Extensions | `uuid-ossp`, `pgcrypto`, `pg_net` | Included in the image |
| Cloudflare Worker | Paystack initialize, verify, webhook, parent pay link, 2-hourly expiry job. Talks to Supabase with the **service role key** | Stays on Cloudflare. Only its `SUPABASE_URL` and key secrets change |

What we do **not** need: Supabase Analytics/Logflare, Vector, the AI assistant, OAuth providers, SMS. Leaving these out cuts RAM use and the attack surface.

## 2. Target architecture

```
Phones / web ──HTTPS──► Cloudflare (proxy, DDoS, caching for images)
                           │
                           ▼
                    VPS: Caddy (TLS, 80/443 only)
                           │
                         Kong (API gateway)
        ┌────────┬─────────┼──────────┬───────────┬──────────────┐
      GoTrue  PostgREST  Realtime   Storage    Edge Runtime   (Studio: private)
        └────────┴─────────┴──────────┴───────────┘
                           │
                       Postgres 17  (not exposed to the internet)

Cloudflare Worker ──HTTPS + service key──► api.<your domain>
```

- Use the official Supabase Docker Compose stack, pinned to specific image versions. Do not track `latest`.
- Public endpoint: one domain, for example `api.gida.apartments`. The app only ever sees this URL.
- Postgres, Studio and the internal ports are never public. Studio is reachable only through an SSH tunnel or a VPN.

## 3. Decisions I need from you

1. **VPS specs and region.** For this stack I'd want at least 4 vCPU, 8 GB RAM, 80 GB SSD, with swap. Our users are in Minna, Nigeria, so latency matters: Lagos/Johannesburg is best if your provider has it, otherwise Frankfurt or London.
2. **Domain** for the API (`api.…`) and who controls its DNS (Cloudflare?).
3. **Email provider for Auth.** You already have Resend in the worker. I'd use its SMTP for signup/reset emails.
4. **Hosted project size**: database size and storage size. This sets the migration window.
5. **Hosted plan and JWT setup.** If the hosted project still uses the legacy JWT secret, we can reuse it on the VPS so existing sessions and the current anon key keep working. If it uses the newer asymmetric signing keys, everyone signs in again once. Please check Settings → API in the dashboard.
6. **Backups destination**: Backblaze B2 or Cloudflare R2 (cheap, off the VPS). Backups on the same machine are not backups.

## 4. The part that can break: apps already installed

The Supabase URL is baked into every app build (`EXPO_PUBLIC_SUPABASE_URL`). Phones running an old build will keep talking to the **hosted** project forever. So:

1. Ship an app build that points at the new domain **before** cutover.
2. At cutover, put the hosted project in read-only or maintenance mode, run the final data copy, then switch.
3. Use the existing in-app release check (`app_releases` table) to nudge or force old builds to update. Old builds left on the hosted project would show stale data and write to a database nobody reads.
4. Keep the hosted project alive, but idle, for one to two weeks as a rollback path. Do not delete it until traffic on it is zero.

The web app is simple: it redeploys with the new URL.

## 5. Phases

### Phase A: prepare in the repo (I can do all of this now)
- `deploy/supabase/`: pinned `docker-compose` with only the services we need, `Caddyfile`, `.env.example`, and a script that generates the secrets (JWT secret, anon and service keys, Postgres password, dashboard password).
- A migration that recreates the **message-push webhook**. Today it is configured in the hosted dashboard, so it is not in `supabase/migrations/`. On self-hosted it must be a trigger calling the edge function through `pg_net`.
- A bucket bootstrap (the baseline already creates the three buckets and their policies).
- A URL rewrite script. Image URLs saved in rows (`listings.primary_image`, listing photo `image_url`, `profiles.avatar_url`) are absolute `https://<project>.supabase.co/...` links and must be rewritten to the new domain after the copy.
- Backup and restore scripts, with a **restore test** that rebuilds from a backup into a scratch database.
- Environment switch for the app and worker, so staging and production use different backends without code changes.

### Phase B: build and rehearse on the VPS (no users yet)
1. Harden the server: SSH keys only, firewall allowing only 22/80/443, fail2ban, automatic security updates, a non-root deploy user.
2. Bring up the stack, apply `supabase/migrations/` from scratch, confirm it matches the hosted schema.
3. Point the local app and the staging worker at it and re-run the checks we already have: sign up and sign in, the reservation flow, the parent payment link with Paystack test keys, support and household chat, image upload.
4. **Dry run the migration**: copy a snapshot of hosted data (schema + `auth` + `public` + storage files) onto the VPS, time it, fix what breaks.
5. Load test the chat and Discover paths. Set Postgres memory settings for the VPS size, and consider PgBouncer (or Supavisor, which is in the stack) so connection counts stay sane.

### Phase C: cutover (planned, short downtime)
1. Announce a maintenance window and ship the app build pointing at the new domain (it can sit dormant until the DNS or flag flips).
2. Put hosted into maintenance. Final dump of `auth` and `public`, then copy storage objects (rclone over the S3 endpoint).
3. Restore on the VPS, run the URL rewrite, run a smoke test script.
4. Switch the worker secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) and redeploy it. Re-point the Paystack webhook only if the worker URL changes (it should not).
5. Open the gates. Watch logs and error rates for the first day.

Rollback: switch the worker and app back to hosted. Data written after cutover would need a manual merge, which is why the window is short and the final copy happens right before the switch.

### Phase D: run it
- **Backups**: nightly `pg_dump` plus storage sync to B2/R2, 30-day retention, and a monthly restore test. If you want point-in-time recovery, add WAL archiving (pgBackRest or wal-g).
- **Monitoring**: Uptime Kuma (or similar) on `/auth/v1/health` and `/rest/v1/`, disk-space and memory alerts, log rotation.
- **Updates**: a written upgrade procedure. Pull the new pinned images, snapshot first, apply, verify. Do it monthly for security fixes.
- **Secrets**: keep `.env` out of git, readable only by the deploy user, and rotate the service role key if it ever leaks. (The production Paystack webhook secret that leaked earlier should be rotated regardless.)

## 6. Risks and how this plan handles them

| Risk | Handling |
|---|---|
| You are now the on-call for the database | Backups off-box, restore tested, uptime alerts to your phone, written runbook |
| Single VPS is a single point of failure | Accept it at this scale. Mitigate with fast restore and provider snapshots. Add a standby replica later only if downtime costs justify it |
| Old app builds keep using hosted | Dormant-then-flip URL, force-update via `app_releases`, hosted kept idle for rollback |
| Sessions invalidated | Reuse the legacy JWT secret if possible. Otherwise one sign-in for everyone, announced in advance |
| Emails land in spam | SMTP via Resend with SPF/DKIM on the domain |
| Disk fills (images) | Storage on a separate volume with an alert at 70 percent. Option to move storage to R2 later via the S3 backend |
| Compose stack drift from hosted features | Pin versions, test migrations on staging first, never edit schema by hand in Studio |

## 7. What I will not do without you

I have no access to the VPS or the hosted project. Anything that touches either (running the stack, copying data, flipping DNS, changing worker secrets) is done by you, or by me only with your explicit go-ahead and access you set up.

## 8. Suggested next step

Answer the six questions in section 3, then I build Phase A in the repo and test the whole stack locally first (the Docker setup runs on this machine, so the rehearsal needs no VPS).
