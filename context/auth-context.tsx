import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { queryClient } from '@/lib/query-clients';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { signOutUserAccount } from '@/services/authService';
import { cacheProfile, getCachedProfile, clearCachedProfile } from '@/services/offline-profile-store';
import { type AuthContextValue, type AuthProfile, SETTLE_TIMEOUT_MS, isOffline, withTimeout } from '@/context/auth-shared';
export type { AdminRole, AuthProfile } from '@/context/auth-shared';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [sessionVerified, setSessionVerified] = useState(false);

  const fetchProfile = useCallback(async (userId: string, email: string | null = null) => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Auth] Failed to fetch profile (will keep cached if available):', error.message);
      return;
    }

    const { data: adminData } = await supabase
      .from('admin_profiles')
      .select('role, assigned_region_id')
      .eq('id', userId)
      .maybeSingle();

    const merged: AuthProfile = {
      ...profileData,
      email: email ?? profile?.email ?? null,
      admin_role: adminData?.role ?? null,
      assigned_region_id: adminData?.assigned_region_id ?? null,
    };

    setProfile(merged);
    cacheProfile(merged);
  }, [profile?.email]);

  useEffect(() => {
    let cancelled = false;
    let realtimeCleanup: (() => void) | null = null;

    const attachRealtime = (userId: string) => {
      realtimeCleanup?.();
      const channel = supabase
        .channel(`profile-changes-${userId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
          () => {
            console.log('[Auth] Profile updated on the server — refreshing.');
            void fetchProfile(userId, profile?.email ?? null).catch((error) => {
              console.log('[Auth] Background profile refresh failed.', error);
            });
          },
        );
      channel.subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log(`[Auth] Realtime channel status: ${status} (switching to manual refresh only)`, err ?? '');
        }
      });
      realtimeCleanup = () => void supabase.removeChannel(channel);
    };

    // Launch settle: cache-first so the homepage renders instantly, then a
    // bounded, silent background sync. The splash screen only ever covers the
    // no-cache determination window — never an unbounded network wait.
    const settle = async () => {
      const cached = getCachedProfile();
      if (cached && !cancelled) {
        setProfile(cached);
        setHasSession(true);
        setIsLoading(false);
      }

      let sessionUser: { id: string; email?: string | null } | null = null;
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), SETTLE_TIMEOUT_MS);
        sessionUser = session?.user ?? null;
      } catch (error) {
        console.log('[Auth] Session check timed out or failed — continuing with cached state.', error);
      }
      if (cancelled) return;

      if (!sessionUser) {
        if (!cached) {
          setProfile(null);
          setHasSession(false);
        }
        setIsLoading(false);
        return;
      }

      setHasSession(true);
      setSessionVerified(true);
      attachRealtime(sessionUser.id);

      // Offline: stay on the cached/session state; the reconnect listener
      // below syncs silently when connectivity returns. No hiccup.
      if (await isOffline()) {
        setIsLoading(false);
        return;
      }

      try {
        await withTimeout(fetchProfile(sessionUser.id, sessionUser.email ?? null), SETTLE_TIMEOUT_MS);
      } catch (error) {
        console.log('[Auth] Background profile refresh failed — keeping current state.', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void settle();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setHasSession(true);
        setSessionVerified(true);
        void fetchProfile(session.user.id, session.user.email ?? null).catch((error) => {
          console.log('[Auth] Background profile refresh failed.', error);
        });
        attachRealtime(session.user.id);
      } else {
        // When Supabase can't refresh the token (e.g. offline), it may emit
        // SIGNED_OUT even though the stored session is still valid. Only clear
        // cached auth if we're actually online — otherwise the reconnect
        // listener will re-verify once connectivity returns.
        void (async () => {
          const offline = await isOffline();
          if (offline) {
            console.log('[Auth] Session lost while offline — keeping cached auth until reconnect.');
            return;
          }
          clearCachedProfile();
          setProfile(null);
          setHasSession(false);
          setSessionVerified(false);
          realtimeCleanup?.();
          realtimeCleanup = null;
        })();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      realtimeCleanup?.();
    };
  }, [fetchProfile]);

  // Silent catch-up when connectivity returns: refresh the profile in the
  // background without touching isLoading, so the user notices nothing.
  const firstNetRun = useRef(true);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
      if (firstNetRun.current) {
        firstNetRun.current = false;
        return;
      }
      if (!state.isConnected) return;
      void (async () => {
        try {
          const { data: { session } } = await withTimeout(supabase.auth.getSession(), SETTLE_TIMEOUT_MS);
          if (!session?.user) return;
          setHasSession(true);
          setSessionVerified(true);
          await withTimeout(fetchProfile(session.user.id, session.user.email ?? null), SETTLE_TIMEOUT_MS);
        } catch (error) {
          console.log('[Auth] Reconnect refresh failed — will retry on next change.', error);
        }
      })();
    });
    return () => unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user.id, session.user.email ?? null);
    }
  }, [fetchProfile]);

  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        void refreshProfile();
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await signOutUserAccount();
    clearCachedProfile();
    queryClient.clear();
    setProfile(null);
    setHasSession(false);
    setSessionVerified(false);
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isAuthenticated: !!profile,
        hasSession,
        isOnline,
        sessionVerified,
        refreshProfile,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
