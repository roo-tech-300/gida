import React, { ReactNode, useRef } from 'react';
import {
  FlatList,
  FlatListProps,
  RefreshControl,
  View,
} from 'react-native';

type LoadingComponent = ReactNode | ((props: { isLoading: boolean }) => ReactNode);

type PaginatedFlatListProps<T> = {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: FlatListProps<T>['renderItem'];
  onEndReached?: FlatListProps<T>['onEndReached'];
  onEndReachedThreshold?: number;
  refreshControl?: boolean;
  onRefresh?: () => void;
  LoadingComponent?: LoadingComponent;
  ListComponent?: ReactNode;
};

export const PaginatedFlatList = <T>({
  data,
  keyExtractor,
  renderItem,
  onEndReached,
  onEndReachedThreshold = 0.5,
  refreshControl = false,
  onRefresh,
  LoadingComponent = (
    <View
      style={{
        padding: 20,
        textAlign: 'center',
        color: 'gray',
      }}
    >
      Loading more…
    </View>
  ),
  ListComponent = <React.Fragment />,
  ...rest
}: PaginatedFlatListProps<T> & FlatListProps<T>) => {
  const lastRenderedIndexRef = useRef(data.length - 1 || 0);

  const handleEndReached = () => {
    onEndReached?.();
  };

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshControl={refreshControl ? (
        <RefreshControl
          refreshing={!!onRefresh}
          onRefresh={onRefresh}
          colors={['#4F46E5']}
        >
          <Spinner size="small" />
        </RefreshControl>
      ) : undefined}
      ListComponent={ListComponent}
      ...rest
    />
  );
};