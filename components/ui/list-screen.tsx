import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { ListState } from '@/components/ui/list-state';
import { LoadingFooter } from '@/components/ui/loading-footer';
import { PaginatedFlatList } from '@/components/ui/paginated-flat-list';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { DesignColors, fontFamily } from '@/constants/design';

export type ListScreenAction = {
  /** With a label the action renders as a full-width pill, otherwise as a round FAB. */
  label?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

type Props<T> = {
  title: string;
  /** Pinned content between the header and the list: search bar, chips, tabs, KPI cards. */
  toolbar?: ReactNode;
  data: readonly T[] | null | undefined;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  emptyMessage?: string;
  emptyIcon?: ComponentProps<typeof Ionicons>['name'];
  isRefetching?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  action?: ListScreenAction;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Non-list siblings such as modals. */
  children?: ReactNode;
};

/**
 * Uniform shell for paginated list screens.
 *
 * The FlatList is the ONLY scroller: `toolbar` stays pinned above it and nothing
 * is wrapped in a plain `ScrollView`. That nesting is what triggers React Native's
 * "VirtualizedLists should never be nested inside plain ScrollViews" warning and
 * silently breaks windowing, `onEndReached` pagination and pull-to-refresh.
 */
export function ListScreen<T>({
  title,
  toolbar,
  data,
  renderItem,
  keyExtractor,
  isLoading = false,
  isError = false,
  onRetry,
  errorMessage,
  emptyMessage,
  emptyIcon,
  isRefetching = false,
  onRefresh,
  onEndReached,
  isLoadingMore = false,
  action,
  contentContainerStyle,
  children,
}: Props<T>) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SafeKeyboardView style={styles.body}>
        <View style={styles.header}>
          <BackButton hasBackground />
          <Text style={styles.title}>{title}</Text>
        </View>

        {toolbar ? <View style={styles.toolbar}>{toolbar}</View> : null}

        <PaginatedFlatList<T>
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={[styles.listContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={DesignColors.primary} />
            ) : undefined
          }
          ListFooterComponent={<LoadingFooter isLoading={isLoadingMore} />}
          ListEmptyComponent={
            isLoading ? (
              <ListState kind="loading" />
            ) : isError ? (
              <ListState kind="error" message={errorMessage} onRetry={onRetry} />
            ) : (
              <ListState kind="empty" message={emptyMessage} icon={emptyIcon} />
            )
          }
        />
      </SafeKeyboardView>

      {children}

      {action ? (
        <Pressable
          style={[action.label ? styles.actionPill : styles.actionRound, { bottom: insets.bottom + 24 }]}
          onPress={action.onPress}
        >
          {action.icon ? (
            <Ionicons name={action.icon} size={action.label ? 20 : 28} color={DesignColors.onSurface} />
          ) : null}
          {action.label ? <Text style={styles.actionLabel}>{action.label}</Text> : null}
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  body: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  toolbar: { paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  list: { flex: 1 },
  listContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 120 },
  actionPill: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 52,
    borderRadius: 26,
    backgroundColor: DesignColors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionRound: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
});
