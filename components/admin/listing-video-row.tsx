import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { ListingVideo } from '@/types/listing-video';
import { formatVideoDuration } from '@/utils/media-url';

const STATUS_LABEL: Record<ListingVideo['status'], string> = {
  queued: 'Waiting to process…',
  processing: 'Processing — usually under 2 minutes',
  ready: 'Live on the listing',
  failed: 'Failed',
};

type Props = {
  video: ListingVideo;
  index: number;
  isDeleting: boolean;
  onDelete: () => void;
};

export function ListingVideoRow({ video, index, isDeleting, onDelete }: Props) {
  const pending = video.status === 'queued' || video.status === 'processing';

  return (
    <View style={styles.row}>
      <View style={styles.thumb}>
        {video.posterUrl ? (
          <Image source={{ uri: video.posterUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : pending ? (
          <ActivityIndicator color={DesignColors.primary} />
        ) : (
          <Ionicons name="alert-circle-outline" size={24} color={DesignColors.danger} />
        )}
        {video.durationSeconds != null ? (
          <View style={styles.duration}>
            <Text style={styles.durationText}>{formatVideoDuration(video.durationSeconds)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Walkthrough #{index + 1}</Text>
        <Text style={[styles.status, video.status === 'failed' && styles.statusFailed]} numberOfLines={2}>
          {video.status === 'failed' && video.error ? video.error : STATUS_LABEL[video.status]}
        </Text>
      </View>

      <Pressable
        style={styles.delete}
        onPress={onDelete}
        disabled={isDeleting}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Delete walkthrough ${index + 1}`}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color={DesignColors.danger} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={DesignColors.danger} />
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
  delete: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
