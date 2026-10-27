import http from 'node:http';
import { AdminAuth } from './auth.ts';
import { recoverJobs, startJanitor } from './cleanup.ts';
import { loadEnv } from './env.ts';
import { HttpError } from './http-error.ts';
import { TranscodeQueue } from './queue.ts';
import { MediaStorage } from './storage.ts';
import { createServiceClient, VideoRepository } from './supabase.ts';
import { createTranscoder } from './transcode.ts';
import { createUploadServer } from './upload.ts';
import { createVideosRoute } from './videos-route.ts';

const env = loadEnv();
const db = createServiceClient(env);
const storage = new MediaStorage(env.dataDir);
const videos = new VideoRepository(db);
const auth = new AdminAuth(db);
const queue = new TranscodeQueue(
  createTranscoder({ storage, videos, maxDurationSeconds: env.maxDurationSeconds }),
);
const uploads = createUploadServer({ env, auth, storage, videos, queue });
const handleVideos = createVideosRoute({ auth, storage, videos, queue, allowedOrigins: env.allowedOrigins });

function sendError(res: http.ServerResponse, error: unknown): void {
  const status = error instanceof HttpError ? error.status_code : 500;
  if (status === 500) console.error('[http] Unhandled error:', error);
  if (res.headersSent) {
    res.end();
    return;
  }
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: error instanceof HttpError ? error.body : 'Internal server error' }));
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, queued: queue.size }));
    return;
  }
  if (pathname === '/uploads' || pathname.startsWith('/uploads/')) {
    uploads.handle(req, res).catch((error: unknown) => sendError(res, error));
    return;
  }
  const videoMatch = /^\/videos\/([^/]+)$/.exec(pathname);
  if (videoMatch) {
    handleVideos(req, res, videoMatch[1]).catch((error: unknown) => sendError(res, error));
    return;
  }
  sendError(res, new HttpError(404, 'Not found'));
});

async function main(): Promise<void> {
  await storage.ensureDirs();
  const deps = { storage, videos, queue, uploads };
  await recoverJobs(deps);
  const janitor = startJanitor(deps);

  server.listen(env.port, () => console.log(`[media-server] listening on :${env.port}`));

  const shutdown = () => {
    console.log('[media-server] shutting down');
    clearInterval(janitor);
    // An interrupted job stays "processing" and is picked up again on boot.
    queue.cancelAll();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error: unknown) => {
  console.error('[media-server] Failed to start:', error);
  process.exit(1);
});
