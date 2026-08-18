import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
import { signOutUserAccount } from '@/services/authService';

export type AdminRole = 'super_admin' | 'regional_admin' | 'field_admin';

export type AuthProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
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

type AuthContextValue = {
  profile: AuthProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, email: string | null = null) => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      setProfile(null);
      return;
    }

    const { data: adminData } = await supabase
      .from('admin_profiles')
      .select('role, assigned_region_id')
      .eq('id', userId)
      .maybeSingle();

    setProfile({
      ...profileData,
      email: email ?? profile?.email ?? null,
      admin_role: adminData?.role ?? null,
      assigned_region_id: adminData?.assigned_region_id ?? null,
    });
  }, [profile?.email]);

  useEffect(() => {
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
            void fetchProfile(userId, profile?.email ?? null);
          },
        )
        .subscribe();
      realtimeCleanup = () => void supabase.removeChannel(channel);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? null).finally(() => setIsLoading(false));
        attachRealtime(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? null);
        attachRealtime(session.user.id);
      } else {
        setProfile(null);
        realtimeCleanup?.();
        realtimeCleanup = null;
      }
    });

    return () => {
      subscription.unsubscribe();
      realtimeCleanup?.();
    };
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
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isAuthenticated: !!profile,
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
