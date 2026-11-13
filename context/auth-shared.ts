import NetInfo from '@react-native-community/netinfo';

// Upper bound for any single launch-time network wait. The splash screen only
// ever covers this window — it can never hang indefinitely.
export const SETTLE_TIMEOUT_MS = 10000;

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Auth settle timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function isOffline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === false;
  } catch {
    return false;
  }
}

export type AdminRole = 'super_admin' | 'regional_admin' | 'field_admin';

export type AuthProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  is_student: boolean | null;
  is_admin: boolean | null;
  admin_role: AdminRole | null;
  assigned_region_id: string | null;
  city: string | null;
  school: string | null;
  onboarded: boolean | null;
  show_in_roommate_feed: boolean | null;
  birth_year: number | null;
  entry_year: number | null;
  program_duration: number | null;
  religion: string | null;
};

export type AuthContextValue = {
  profile: AuthProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // True when a Supabase session exists even if the profile row hasn't loaded
  // yet (e.g. offline on first run). Lets the router send the user to the
  // homepage best-effort instead of bouncing them to login.
  hasSession: boolean;
  // Live network state — lets screens show an offline banner or fall back to
  // cached data without polling NetInfo themselves.
  isOnline: boolean;
  // True once the session has been confirmed against Supabase in the current
  // app session. Until then the user is "provisionally logged in" from cache
  // and the UI can show a subtle syncing indicator.
  sessionVerified: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};
