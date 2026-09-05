import * as SQLite from 'expo-sqlite';
import type { AuthProfile } from '@/context/auth-context';

const DB_NAME = 'gida_offline.db';

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS cached_profile (
        id TEXT PRIMARY KEY,
        email TEXT,
        full_name TEXT,
        username TEXT,
        avatar_url TEXT,
        bio TEXT,
        gender TEXT,
        is_student INTEGER,
        is_admin INTEGER,
        admin_role TEXT,
        assigned_region_id TEXT,
        city TEXT,
        school TEXT,
        onboarded INTEGER,
        show_in_roommate_feed INTEGER,
        birth_year INTEGER,
        entry_year INTEGER,
        program_duration INTEGER,
        religion TEXT,
        cached_at INTEGER NOT NULL
      );
    `);
  }
  return db;
}

export function cacheProfile(profile: AuthProfile): void {
  try {
    const database = getDb();
    database.runSync(
      `INSERT OR REPLACE INTO cached_profile (
        id, email, full_name, username, avatar_url, bio, gender,
        is_student, is_admin, admin_role, assigned_region_id,
        city, school, onboarded, show_in_roommate_feed,
        birth_year, entry_year, program_duration, religion, cached_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.email ?? null,
        profile.full_name ?? null,
        profile.username ?? null,
        profile.avatar_url ?? null,
        profile.bio ?? null,
        profile.gender ?? null,
        profile.is_student ? 1 : 0,
        profile.is_admin ? 1 : 0,
        profile.admin_role ?? null,
        profile.assigned_region_id ?? null,
        profile.city ?? null,
        profile.school ?? null,
        profile.onboarded ? 1 : 0,
        profile.show_in_roommate_feed ? 1 : 0,
        profile.birth_year ?? null,
        profile.entry_year ?? null,
        profile.program_duration ?? null,
        profile.religion ?? null,
        Date.now(),
      ],
    );
  } catch (error) {
    console.error('[OfflineProfileStore] Failed to cache profile:', error);
  }
}

export function getCachedProfile(): AuthProfile | null {
  try {
    const database = getDb();
    const row = database.getFirstSync<{
      id: string;
      email: string | null;
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
      bio: string | null;
      gender: string | null;
      is_student: number;
      is_admin: number;
      admin_role: string | null;
      assigned_region_id: string | null;
      city: string | null;
      school: string | null;
      onboarded: number;
      show_in_roommate_feed: number;
      birth_year: number | null;
      entry_year: number | null;
      program_duration: number | null;
      religion: string | null;
    }>('SELECT * FROM cached_profile LIMIT 1');

    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      username: row.username,
      avatar_url: row.avatar_url,
      bio: row.bio,
      gender: row.gender as AuthProfile['gender'],
      is_student: row.is_student === 1,
      is_admin: row.is_admin === 1,
      admin_role: row.admin_role as AuthProfile['admin_role'],
      assigned_region_id: row.assigned_region_id,
      city: row.city,
      school: row.school,
      onboarded: row.onboarded === 1,
      show_in_roommate_feed: row.show_in_roommate_feed === 1,
      birth_year: row.birth_year,
      entry_year: row.entry_year,
      program_duration: row.program_duration,
      religion: row.religion,
    };
  } catch (error) {
    console.error('[OfflineProfileStore] Failed to read cached profile:', error);
    return null;
  }
}

export function clearCachedProfile(): void {
  try {
    const database = getDb();
    database.runSync('DELETE FROM cached_profile');
  } catch (error) {
    console.error('[OfflineProfileStore] Failed to clear cached profile:', error);
  }
}
