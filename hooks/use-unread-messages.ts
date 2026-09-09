import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

let activeChannel: ReturnType<typeof supabase.channel> | null = null;
let activeUserId: string | null = null;
let refCount = 0;

export function useUnreadMessages() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

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

    refCount++;

    if (activeChannel && activeUserId === userId) {
      return () => {
        refCount--;
        if (refCount === 0 && activeChannel) {
          void supabase.removeChannel(activeChannel);
          activeChannel = null;
          activeUserId = null;
        }
      };
    }

    if (activeChannel) {
      void supabase.removeChannel(activeChannel);
    }

    const channel = supabase
      .channel(`unread-messages-${userId}`)
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

    activeChannel = channel;
    activeUserId = userId;

    return () => {
      refCount--;
      if (refCount === 0) {
        void supabase.removeChannel(channel);
        activeChannel = null;
        activeUserId = null;
      }
    };
  }, [userId]);

  return count;
}
