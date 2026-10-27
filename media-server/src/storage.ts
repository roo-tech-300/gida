import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isVideoId(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}

/**
 * Folder layout under DATA_DIR:
 *   uploads/<id>      raw tus upload (deleted after transcoding)
 *   work/<id>/        transcoder output while in progress
 *   public/v/<id>/    finished, immutable output served by Caddy
 */
export class MediaStorage {
  readonly uploadsDir: string;
  readonly workDir: string;
  readonly publishedDir: string;

  constructor(dataDir: string) {
    this.uploadsDir = path.join(dataDir, 'uploads');
    this.workDir = path.join(dataDir, 'work');
    this.publishedDir = path.join(dataDir, 'public', 'v');
  }

  async ensureDirs(): Promise<void> {
    await Promise.all([this.uploadsDir, this.workDir, this.publishedDir].map((dir) => mkdir(dir, { recursive: true })));
  }

  rawPath(id: string): string {
    return path.join(this.uploadsDir, id);
  }

  workPath(id: string): string {
    return path.join(this.workDir, id);
  }

  /** Path stored in Supabase; the app prefixes it with the CDN base URL. */
  static publicPath(id: string, file: string): string {
    return `v/${id}/${file}`;
  }

  async rawExists(id: string): Promise<boolean> {
    try {
      return (await stat(this.rawPath(id))).isFile();
    } catch {
      return false;
    }
  }

  /** Moves finished output into the served folder in one step, so nobody sees a half-written video. */
  async publish(id: string): Promise<void> {
    const target = path.join(this.publishedDir, id);
    await rm(target, { recursive: true, force: true });
    await rename(this.workPath(id), target);
  }

  async removeRaw(id: string): Promise<void> {
    await Promise.all([
      rm(this.rawPath(id), { force: true }),
      rm(`${this.rawPath(id)}.json`, { force: true }),
    ]);
  }

  async removeWork(id: string): Promise<void> {
    await rm(this.workPath(id), { recursive: true, force: true });
  }

  async removeAll(id: string): Promise<void> {
    await Promise.all([
      this.removeRaw(id),
      this.removeWork(id),
      rm(path.join(this.publishedDir, id), { recursive: true, force: true }),
    ]);
  }

  async clearWork(): Promise<void> {
    await rm(this.workDir, { recursive: true, force: true });
    await mkdir(this.workDir, { recursive: true });
  }

  /** Published video ids with the time their folder was last modified. */
  async listPublished(): Promise<{ id: string; modifiedAt: number }[]> {
    const entries = await readdir(this.publishedDir, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory() && isVideoId(entry.name));
    return Promise.all(
      folders.map(async (entry) => ({
        id: entry.name,
        modifiedAt: (await stat(path.join(this.publishedDir, entry.name))).mtimeMs,
      })),
    );
  }
}
