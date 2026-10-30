import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { formatVideoDuration } from '@/utils/media-url';

type Props = {
  thumbnail: ReactNode;
  durationSeconds: number | null;
  title: string;
  status: string;
  statusFailed?: boolean;
  removeIcon: 'trash-outline' | 'close';
  removeLabel: string;
  isRemoving?: boolean;
  onRemove: () => void;
};

/** One walkthrough video line: thumbnail, title, status and a remove button. */
export function VideoRowLayout({
  thumbnail,
  durationSeconds,
  title,
  status,
  statusFailed = false,
  removeIcon,
  removeLabel,
  isRemoving = false,
  onRemove,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.thumb}>
        {thumbnail}
        {durationSeconds != null ? (
          <View style={styles.duration}>
            <Text style={styles.durationText}>{formatVideoDuration(durationSeconds)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.status, statusFailed && styles.statusFailed]} numberOfLines={2}>
          {status}
        </Text>
      </View>

      <Pressable
        style={styles.remove}
        onPress={onRemove}
        disabled={isRemoving}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
      >
        {isRemoving ? (
          <ActivityIndicator size="small" color={DesignColors.danger} />
        ) : (
          <Ionicons name={removeIcon} size={20} color={DesignColors.danger} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    padding: DesignSpacing.sm,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  thumb: {
    width: 88,
    height: 56,
    borderRadius: DesignRadius.sm,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: DesignColors.scrimHeavy,
  },
  durationText: { fontSize: 10, fontWeight: '700', color: DesignColors.textPrimary, fontFamily },
  body: { flex: 1, gap: 2 },
  title: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  status: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily },
  statusFailed: { color: DesignColors.danger },
  remove: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
