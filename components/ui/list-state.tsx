import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';

export type ListStateKind = 'loading' | 'error' | 'empty';

type Props = {
  kind: ListStateKind;
  message?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onRetry?: () => void;
};

const DEFAULT_MESSAGES: Record<ListStateKind, string> = {
  loading: 'Loading…',
  error: 'Something went wrong. Please try again.',
  empty: 'Nothing here yet.',
};

const EMPTY_ICONS: Record<'error' | 'empty', ComponentProps<typeof Ionicons>['name']> = {
  error: 'cloud-offline-outline',
  empty: 'search-outline',
};

/** Shared loading / error / empty block used by list screens so states look identical. */
export function ListState({ kind, message, icon, onRetry }: Props) {
  if (kind === 'loading') {
    return (
      <View style={styles.block}>
        <ActivityIndicator size="large" color={DesignColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <Ionicons name={icon ?? EMPTY_ICONS[kind]} size={32} color={DesignColors.onSurfaceVariant} />
      <Text style={styles.text}>{message ?? DEFAULT_MESSAGES[kind]}</Text>
      {kind === 'error' && onRetry ? (
        <Pressable style={styles.retry} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 72 },
  text: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
  retry: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: DesignColors.primaryContainer,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
});
