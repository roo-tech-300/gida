/**
 * Shared helpers for the local seed. Refuses to talk to anything that is not the
 * local Supabase stack started by `npx supabase start`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { SeedUser } from '../../dummy/local-seed-data.ts';

export const REPO_ROOT = join(import.meta.dirname, '..', '..');
const SUPABASE_CLI = ['-y', 'supabase@3.1.0'];
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

export interface LocalStack {
  apiUrl: string;
  serviceRoleKey: string;
  /** Base URL baked into image URLs; must be reachable from the phone/emulator. */
  publicUrl: string;
}

interface StatusJson {
  API_URL?: string;
  SERVICE_ROLE_KEY?: string;
}

function readEnvLocal(key: string): string | undefined {
  const file = join(REPO_ROOT, '.env.local');
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith(`${key}=`));
  return line?.slice(key.length + 1).trim() || undefined;
}

export function readLocalStack(): LocalStack {
  let raw: string;
  try {
    raw = execFileSync('npx', [...SUPABASE_CLI, 'status', '-o', 'json'], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    console.error('[Seed] Could not read local Supabase status. Is the stack running? Try `npm run db:start`.', error);
    throw error;
  }
  const status = JSON.parse(raw.slice(raw.indexOf('{'))) as StatusJson;
  if (!status.API_URL || !status.SERVICE_ROLE_KEY) throw new Error('[Seed] Local Supabase status is missing API_URL or SERVICE_ROLE_KEY.');

  const host = new URL(status.API_URL).hostname;
  if (!LOCAL_HOSTS.has(host)) throw new Error(`[Seed] Refusing to seed non-local host "${host}".`);

  const publicUrl = (process.env.SEED_PUBLIC_URL ?? readEnvLocal('EXPO_PUBLIC_SUPABASE_URL') ?? status.API_URL).replace(/\/$/, '');
  if (publicUrl.includes('supabase.co')) throw new Error('[Seed] SEED_PUBLIC_URL points at a hosted project. Refusing.');
  return { apiUrl: status.API_URL, serviceRoleKey: status.SERVICE_ROLE_KEY, publicUrl };
}

export function adminClient(stack: LocalStack): SupabaseClient {
  return createClient(stack.apiUrl, stack.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Throws with context when a Supabase call returned an error. */
export function must<T>(label: string, result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(`[Seed] ${label}: ${result.error.message}`);
  if (result.data === null || result.data === undefined) throw new Error(`[Seed] ${label}: no data returned`);
  return result.data;
}

const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

/** Uploads dummy/images/<path> into a bucket and returns its public URL. */
export async function uploadImage(db: SupabaseClient, stack: LocalStack, bucket: string, imagePath: string): Promise<string> {
  const file = readFileSync(join(REPO_ROOT, 'dummy', 'images', imagePath));
  const objectPath = `seed/${imagePath}`;
  const contentType = MIME[extname(imagePath).toLowerCase()] ?? 'application/octet-stream';
  const { error } = await db.storage.from(bucket).upload(objectPath, file, { upsert: true, contentType });
  if (error) throw new Error(`[Seed] upload ${bucket}/${objectPath}: ${error.message}`);
  return `${stack.publicUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
}

async function findUserId(db: SupabaseClient, email: string): Promise<string | undefined> {
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(`[Seed] listUsers: ${error.message}`);
  return data.users.find((u) => u.email === email)?.id;
}

/** Creates (or reuses) an auth user. The on_auth_user_created trigger makes the profile row. */
export async function ensureUser(db: SupabaseClient, user: SeedUser, password: string): Promise<string> {
  const { data, error } = await db.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: user.fullName },
  });
  if (data.user) return data.user.id;
  const existing = await findUserId(db, user.email);
  if (existing) return existing;
  throw new Error(`[Seed] createUser ${user.email}: ${error?.message ?? 'unknown error'}`);
}

export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

export function localDate(dayOffset: number): string {
  const d = new Date(Date.now() + dayOffset * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function naira(amount: number): string {
  return `₦${amount.toLocaleString('en-US')}`;
}
