import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAppToast } from '@/components/ui/toast-card';

type TourAlertsContextType = {
  unread: number;
  clearUnread: () => void;
};

const TourAlertsContext = createContext<TourAlertsContextType | undefined>(undefined);

export function TourAlertsProvider({ children }: { children: ReactNode }) {
  const { showToast } = useAppToast();
  const queryClient = useQueryClient();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel('tour-bookings-admin-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tour_bookings' },
        () => {
          showToast({ title: 'New tour booked', message: 'A resident booked a guided tour.', type: 'info' });
          setUnread((count) => count + 1);
          queryClient.invalidateQueries({ queryKey: ['admin-tours'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast, queryClient]);

  const clearUnread = useCallback(() => setUnread(0), []);

  return (
    <TourAlertsContext.Provider value={{ unread, clearUnread }}>
      {children}
    </TourAlertsContext.Provider>
  );
}

export function useTourAlerts(): TourAlertsContextType {
  const context = useContext(TourAlertsContext);
  if (!context) {
    throw new Error('useTourAlerts must be used within a TourAlertsProvider');
  }
  return context;
}
