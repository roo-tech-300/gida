import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function DiscoverEmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons color={DesignColors.primaryFixed} name="grid-outline" size={30} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignColors.onSurface,
    fontFamily,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    marginTop: 4,
  },
  action: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DesignColors.primary,
    backgroundColor: DesignColors.primary,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignColors.onPrimary,
    fontFamily,
  },
});