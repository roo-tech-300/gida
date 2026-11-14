import { useRef, useState } from 'react';
import type { ViewToken } from 'react-native';

const VIEWABILITY = { itemVisiblePercentThreshold: 60 } as const;

/**
 * Tracks the first mostly-visible item of a FlatList, so only that card plays a preview.
 * Both returned props are referentially stable (FlatList forbids changing them on the fly).
 */
export function useActiveFeedItem<T extends { id: string }>() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const configRef = useRef(VIEWABILITY);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<T>[] }) => {
    setActiveId(viewableItems[0]?.item?.id ?? null);
  });

  
  return { activeId, viewabilityConfig: configRef.current, onViewableItemsChanged: onViewableItemsChanged.current };
}
