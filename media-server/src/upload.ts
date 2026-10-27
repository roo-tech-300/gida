import { randomUUID } from 'node:crypto';
import { FileStore } from '@tus/file-store';
import { Server } from '@tus/server';
import type { AdminAuth } from './auth.ts';
import type { Env } from './env.ts';
import { HttpError } from './http-error.ts';
import type { TranscodeQueue } from './queue.ts';
import { isVideoId, type MediaStorage } from './storage.ts';
import type { VideoRepository } from './supabase.ts';

const ABANDONED_UPLOAD_MS = 24 * 60 * 60 * 1000;

export interface UploadDeps {
  env: Env;
  auth: AdminAuth;
  storage: MediaStorage;
  videos: VideoRepository;
  queue: TranscodeQueue;
}

/**
 * Resumable uploads (tus protocol). The client sends metadata
 * `listingId` and `filetype`; the server records who uploaded it.
 */
export function createUploadServer({ env, auth, storage, videos, queue }: UploadDeps): Server {
  return new Server({
    path: '/uploads',
    datastore: new FileStore({
      directory: storage.uploadsDir,
      expirationPeriodInMilliseconds: ABANDONED_UPLOAD_MS,
    }),
    maxSize: env.maxUploadBytes,
    respectForwardedHeaders: true,
    allowedOrigins: env.allowedOrigins.length > 0 ? env.allowedOrigins : undefined,
    disableTerminationForFinishedUploads: true,
    namingFunction: () => randomUUID(),

    async onIncomingRequest(req) {
      await auth.requireAdmin(req.headers);
    },

    async onUploadCreate(req, upload) {
      const admin = await auth.requireAdmin(req.headers);
      const listingId = upload.metadata?.listingId;
      if (!isVideoId(listingId)) throw new HttpError(400, 'Missing or invalid listingId metadata');
      if (!upload.metadata?.filetype?.startsWith('video/')) {
        throw new HttpError(415, 'Only video files can be uploaded');
      }

      await auth.requireListingAccess(admin, listingId);
      if ((await videos.countActive(listingId)) >= env.maxVideosPerListing) {
        throw new HttpError(409, `A listing can have at most ${env.maxVideosPerListing} videos`);
      }
      return { metadata: { ...upload.metadata, uploadedBy: admin.id } };
    },

    async onUploadFinish(_req, upload) {
      const listingId = upload.metadata?.listingId;
      const uploadedBy = upload.metadata?.uploadedBy;
      if (!isVideoId(listingId) || !uploadedBy) {
        await storage.removeRaw(upload.id);
        throw new HttpError(400, 'Upload is missing its listing metadata');
      }

      // Re-check: two uploads for the same listing may have started together.
      const count = await videos.countActive(listingId);
      if (count >= env.maxVideosPerListing) {
        await storage.removeRaw(upload.id);
        throw new HttpError(409, `A listing can have at most ${env.maxVideosPerListing} videos`);
      }

      await videos.insertQueued(upload.id, listingId, uploadedBy, count);
      queue.enqueue(upload.id);
      return {};
    },
  });
}
