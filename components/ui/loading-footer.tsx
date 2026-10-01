import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { DesignColors } from '@/constants/design';

type LoadingFooterProps = {
  /** Whether the next page is currently in flight. */
  isLoading: boolean;
  /** Optional caption rendered once loading finishes (e.g. "No more listings"). */
  text?: string;
};

/**
 * Shared footer for paginated lists. It renders wherever new content arrives: at the
 * bottom of a normal list, and at the top of an `inverted` chat list.
 */
export const LoadingFooter = ({ isLoading, text }: LoadingFooterProps) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={DesignColors.primary} />
      </View>
    );
  }

  if (!text) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    color: DesignColors.onSurfaceVariant,
  },
});
