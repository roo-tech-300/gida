import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

type LodgeAlertsContextType = {
  unread: number;
  clearUnread: () => void;
};

const LodgeAlertsContext = createContext<LodgeAlertsContextType | undefined>(undefined);

export function LodgeAlertsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel('lodge-reservation-admin-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'slot_credits', filter: 'status=eq.pending_verification' },
        () => {
          setUnread((count) => count + 1);
          queryClient.invalidateQueries({ queryKey: ['admin-lodge-reservations'] });
        },
      );
    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.log(`[LodgeAlerts] Realtime channel status: ${status}`, err ?? '');
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const clearUnread = useCallback(() => setUnread(0), []);

  return (
    <LodgeAlertsContext.Provider value={{ unread, clearUnread }}>
      {children}
    </LodgeAlertsContext.Provider>
  );
}

export function useLodgeAlerts(): LodgeAlertsContextType {
  const context = useContext(LodgeAlertsContext);
  if (!context) {
    throw new Error('useLodgeAlerts must be used within a LodgeAlertsProvider');
  }
  return context;
}
