import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

export function useUnreadMessages() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    // Initial data fetch
    const loadInitial = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('unread_a, unread_b')
        .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);

      if (!error && data) {
        const total = data.reduce((sum, row) =>
          sum + (row.unread_a ?? 0) + (row.unread_b ?? 0), 0);
        setCount(total);
      }
    };

    loadInitial();

    // Real-time subscription for new/updated conversations.
    // One filter per postgres_changes handler, so subscribe as both
    // participant_a and participant_b.
    //
    // Use a unique channel name per mount to avoid Supabase returning a
    // cached, already-subscribed channel instance — which causes the
    // "cannot add postgres_changes callbacks after subscribe()" error.
    const channelName = `unread-messages-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations', filter: `participant_a=eq.${userId}` },
        () => loadInitial()
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations', filter: `participant_b=eq.${userId}` },
        () => loadInitial()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `participant_a=eq.${userId}` },
        () => loadInitial()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `participant_b=eq.${userId}` },
        () => loadInitial()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return count;
}