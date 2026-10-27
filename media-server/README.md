# Gida media server

Uploads, transcodes and serves listing walkthrough videos. Runs on the Contabo VPS
as two containers: `media-server` (Node + FFmpeg) and `caddy` (HTTPS + static files).

```
Admin app ──tus upload──▶ /uploads ─▶ listing_videos row (queued)
                                       ▼
                       FFmpeg, one job at a time
                       360p/540p/720p HLS + poster + 8s preview
                                       ▼
                       public/v/<id>/  ─▶ row status = ready
Students ◀── CDN ◀── Caddy /v/<id>/master.m3u8
```

## Endpoints

| Route | Auth | Purpose |
|---|---|---|
| `POST/HEAD/PATCH /uploads[/<id>]` | Admin JWT | tus resumable upload. Metadata: `listingId`, `filetype` |
| `DELETE /videos/<id>` | Admin JWT | Stop processing, delete files and row |
| `GET /health` | none | `{ ok, queued }` |
| `GET /v/<id>/…` | none | Finished files (served by Caddy, cached forever) |

"Admin" means a row in `admin_profiles` that can manage the listing: super admins,
the listing's owner, or the regional admin of its region (same rule as
`can_manage_listing()` in SQL).

## Limits

Set in `.env`: 500 MB per upload, 3 minutes per video, 3 videos per listing.
Abandoned uploads are deleted after 24h. Every 6 hours a cleanup job removes video
folders whose row is gone (e.g. the listing was deleted).

## Deploying to the VPS

1. Point a DNS record (e.g. `media.gida.ng`) at the VPS IP. Open ports 80 and 443.
2. Install Docker, then copy this folder to the server.
3. Apply `supabase/migrations/20261027_listing_videos.sql` to the Supabase project.
4. `cp .env.example .env` and fill it in.
5. `docker compose up -d --build`
6. Check: `curl https://media.gida.ng/health` should return `{"ok":true,"queued":0}`.

### CDN

Put a pull CDN (e.g. a Bunny pull zone) in front of `https://<MEDIA_DOMAIN>`:
origin = `https://<MEDIA_DOMAIN>`, and respect origin cache headers. Set the app's
`EXPO_PUBLIC_MEDIA_CDN_URL` to the CDN hostname. Uploads go straight to
`EXPO_PUBLIC_MEDIA_UPLOAD_URL` (the VPS), not through the CDN.

Don't serve video through Cloudflare's free proxy; its terms restrict that.

### Backups

All videos live in the `media` Docker volume. Turn on Contabo snapshots, or sync
`/var/lib/docker/volumes/<folder>_media/_data/public` (`<folder>` is the directory
holding `docker-compose.yml`; check with `docker volume ls`) to object storage.

## Development

```
npm install
npm test          # unit tests (ladder, probe, auth rules, queue)
npm run typecheck
cp .env.example .env && node --env-file=.env src/index.ts   # needs ffmpeg on PATH
```

Node 24 runs the TypeScript directly, so there's no build step. Use only
erasable syntax (no enums or parameter properties) and `.ts` import paths.

### End-to-end check on the VPS

Upload a short phone clip from the admin app (create/edit listing → media step).
Then `docker compose logs -f media-server` should show
`[transcode] <id> ready in Ns`, and `https://<MEDIA_DOMAIN>/v/<id>/master.m3u8`
should play in Safari or VLC.
