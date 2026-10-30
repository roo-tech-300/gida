import path from 'node:path';

export interface Env {
  port: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  /** Root folder holding uploads/, work/ and public/ (shared with Caddy). */
  dataDir: string;
  /** Origins allowed to upload from a browser (the Expo web build). */
  allowedOrigins: string[];
  maxUploadBytes: number;
  maxDurationSeconds: number;
  maxVideosPerListing: number;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[env] Missing required environment variable ${name}`);
  return value;
}

function numberOr(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`[env] ${name} must be a positive number, got "${raw}"`);
  }
  return value;
}

export function loadEnv(): Env {
  return {
    port: numberOr('PORT', 3000),
    supabaseUrl: required('SUPABASE_URL'),
    supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    dataDir: path.resolve(process.env.DATA_DIR ?? '/srv/media'),
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    maxUploadBytes: numberOr('MAX_UPLOAD_MB', 500) * 1024 * 1024,
    maxDurationSeconds: numberOr('MAX_DURATION_SECONDS', 180),
    maxVideosPerListing: numberOr('MAX_VIDEOS_PER_LISTING', 3),
  };
}
