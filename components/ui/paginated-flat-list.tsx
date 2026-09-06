import React from 'react';
import { FlatList, type FlatListProps } from 'react-native';
import type { ListRenderItem } from 'react-native';

type PaginatedFlatListProps<T> = {
  data: readonly T[] | null | undefined;
  keyExtractor?: (item: T, index: number) => string;
  renderItem?: ListRenderItem<T> | null | undefined;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
} & Omit<
  FlatListProps<T>,
  'data' | 'keyExtractor' | 'renderItem' | 'onEndReached' | 'onEndReachedThreshold'
>;

export function PaginatedFlatList<T>({
  data,
  keyExtractor,
  renderItem,
  onEndReached,
  onEndReachedThreshold = 0.5,
  ...rest
}: PaginatedFlatListProps<T>) {
  return (
    <FlatList<T>
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      {...rest}
    />
  );
}