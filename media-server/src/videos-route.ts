import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AdminAuth } from './auth.ts';
import { HttpError } from './http-error.ts';
import type { TranscodeQueue } from './queue.ts';
import { isVideoId, type MediaStorage } from './storage.ts';
import type { VideoRepository } from './supabase.ts';

export interface VideosRouteDeps {
  auth: AdminAuth;
  storage: MediaStorage;
  videos: VideoRepository;
  queue: TranscodeQueue;
  allowedOrigins: string[];
}

function toHeaders(req: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(name, value);
  }
  return headers;
}

function applyCors(req: IncomingMessage, res: ServerResponse, allowedOrigins: string[]): void {
  const origin = req.headers.origin;
  if (!origin || (allowedOrigins.length > 0 && !allowedOrigins.includes(origin))) return;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
}

/** DELETE /videos/:id: stops any processing, removes the files, then the row. */
export function createVideosRoute({ auth, storage, videos, queue, allowedOrigins }: VideosRouteDeps) {
  return async function handleVideos(req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
    applyCors(req, res, allowedOrigins);
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    if (req.method !== 'DELETE') throw new HttpError(405, 'Method not allowed');
    if (!isVideoId(id)) throw new HttpError(400, 'Invalid video id');

    const admin = await auth.requireAdmin(toHeaders(req));
    const row = await videos.get(id);
    if (!row) throw new HttpError(404, 'Video not found');
    await auth.requireListingAccess(admin, row.listing_id);

    queue.cancel(id);
    await storage.removeAll(id);
    await videos.delete(id);
    res.writeHead(204).end();
  };
}
