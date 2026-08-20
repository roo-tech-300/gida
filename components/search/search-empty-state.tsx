import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  query: string;
  isLoading: boolean;
};

export function SearchEmptyState({ query, isLoading }: Props) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DesignColors.primary} />
        <Text style={styles.loadingText}>Searching...</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Ionicons name="search-outline" size={40} color={DesignColors.onSurfaceVariant} />
      </View>
      <Text style={styles.title}>No results</Text>
      <Text style={styles.subtitle}>
        {query ? `Nothing found for "${query}"` : 'Start typing to search'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSpacing.xl * 2,
    gap: DesignSpacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    maxWidth: 260,
  },
  loadingText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
