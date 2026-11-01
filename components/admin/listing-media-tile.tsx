import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignTypography, fontFamily } from '@/constants/design';
import type { WizardMedia } from '@/types/wizard-media';
import { formatVideoDuration } from '@/utils/media-url';

type Props = {
  media: WizardMedia;
  label?: string;
  isHero?: boolean;
  isRemoving?: boolean;
  onRemove?: () => void;
};

function videoCaption(media: WizardMedia): string {
  if (media.kind === 'video') return media.video.fileName;
  if (media.kind === 'uploaded-video') return formatVideoDuration(media.video.durationSeconds) || 'Video';
  return '';
}

/** One photo or video in the wizard's cover/gallery grids. */
export function ListingMediaTile({ media, label, isHero = false, isRemoving = false, onRemove }: Props) {
  const isVideo = media.kind !== 'photo';
  const posterUri =
    media.kind === 'photo' ? media.uri : media.kind === 'uploaded-video' ? media.video.posterUrl : null;
  const pending =
    media.kind === 'uploaded-video' &&
    (media.video.status === 'queued' || media.video.status === 'processing');
  const failed = media.kind === 'uploaded-video' && media.video.status === 'failed';

  return (
    <View style={styles.tile}>
      {posterUri ? (
        <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}

      {!posterUri ? (
        <View style={styles.placeholder}>
          {isVideo ? (
            <>
              <View style={styles.playIcon}>
                <Ionicons name="play" size={20} color={DesignColors.onPrimaryContainer} />
              </View>
              <Text style={styles.fileName} numberOfLines={2}>
                {videoCaption(media)}
              </Text>
            </>
          ) : (
            <ActivityIndicator size="small" color={DesignColors.primary} />
          )}
        </View>
      ) : null}

      {isVideo && posterUri ? (
        <View style={styles.playBadge}>
          <Ionicons name="play" size={14} color={DesignColors.onPrimaryContainer} />
        </View>
      ) : null}

      {pending ? (
        <View style={styles.statusOverlay}>
          <ActivityIndicator size="small" color={DesignColors.primary} />
          <Text style={styles.statusText}>Processing…</Text>
        </View>
      ) : null}

      {failed ? (
        <View style={styles.statusOverlay}>
          <Ionicons name="alert-circle-outline" size={20} color={DesignColors.danger} />
          <Text style={styles.statusText}>Failed</Text>
        </View>
      ) : null}

      {isHero ? (
        <View style={styles.heroBadge}>
          <Ionicons name="star" size={11} color={DesignColors.onPrimaryContainer} />
          <Text style={styles.heroBadgeText}>COVER</Text>
        </View>
      ) : null}

      {label ? (
        <View style={styles.label}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      ) : null}

      {onRemove ? (
        <Pressable
          style={styles.remove}
          onPress={onRemove}
          disabled={isRemoving}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Remove this media"
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color={DesignColors.error} />
          ) : (
            <Ionicons name="close-circle" size={22} color={DesignColors.error} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: DesignRadius.sm,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
  },
  playIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  fileName: {
    fontSize: 10,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
  playBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: DesignColors.scrimHeavy,
  },
  statusText: {
    ...DesignTypography.labelSm,
    fontSize: 10,
    color: DesignColors.onSurface,
    fontFamily,
  },
  heroBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.scrimHeavy,
  },
  heroBadgeText: {
    ...DesignTypography.labelSm,
    fontSize: 10,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  label: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: DesignColors.surfaceContainerHighest,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    color: DesignColors.primary,
    fontFamily,
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: DesignColors.scrim,
  },
});
