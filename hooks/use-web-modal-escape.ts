import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useWebModalEscape(visible: boolean, onClose: () => void): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible) onClose();
    };
    if (typeof window !== 'undefined') window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);
}
