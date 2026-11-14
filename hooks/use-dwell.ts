import { useEffect, useState } from 'react';

/** True once `active` has stayed true for `delayMs`; false again the moment it turns false. */
export function useDwell(active: boolean, delayMs: number): boolean {
  const [dwelled, setDwelled] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setDwelled(true), delayMs);
    return () => {
      clearTimeout(timer);
      setDwelled(false);
    };
  }, [active, delayMs]);

  return active && dwelled;
}
