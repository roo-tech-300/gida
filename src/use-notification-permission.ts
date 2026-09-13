import { useEffect } from 'react';
import { requestNotificationPermission } from '@/src/notifications';

export function useNotificationPermission() {
  useEffect(() => {
    const init = async () => {
      await requestNotificationPermission();
    };
    init();
  }, []);
}