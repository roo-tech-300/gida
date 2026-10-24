import { useCallback, useSyncExternalStore } from 'react';

/**
 * In-memory saved-places store. Shared across the Discover feed and the place
 * detail screen so a bookmark stays in sync while we are on dummy data.
 */
let savedIds: string[] = [];
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string[] {
  return savedIds;
}

function update(next: string[]): void {
  savedIds = next;
  listeners.forEach((listener) => listener());
}

export function useSavedPlaces() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      update(ids.includes(id) ? ids.filter((savedId) => savedId !== id) : [...ids, id]);
    },
    [ids],
  );

  return { ids, count: ids.length, isSaved, toggle };
}
