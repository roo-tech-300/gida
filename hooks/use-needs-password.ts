import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

/** True for an account made from an email alone, until the student chooses a password. */
export function useNeedsPassword(): boolean {
  const [needs, setNeeds] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession()
      .then(({ data }) => { if (active) setNeeds(data.session?.user?.user_metadata?.needs_password === true); })
      .catch((error) => console.error('[NeedsPassword] Could not read the session:', error));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setNeeds(session?.user?.user_metadata?.needs_password === true);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return needs;
}
