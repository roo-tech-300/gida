import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useListingUploadProgress } from '@/hooks/use-listing-upload-progress';
import type { ListingVideoStatus } from '@/types/listing-video';

type Props = { listingId: string; expected: number; statuses: ListingVideoStatus[] };

export function ListingReadinessProgress({ listingId, expected, statuses }: Props) {
  const upload = useListingUploadProgress(listingId);
  const ready = statuses.filter((status) => status === 'ready').length;
  const failed = statuses.filter((status) => status === 'failed').length;
  const uploading = upload?.status === 'uploading';
  const processing = statuses.some((status) => status === 'queued' || status === 'processing');
  const interrupted = !upload && statuses.length < expected;
  const localFailure = upload?.status === 'failed';
  const fill = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const ratio = upload?.status === 'uploading' ? upload.progress / 100 : ready / Math.max(expected, 1);

  useEffect(() => {
    Animated.timing(fill, { toValue: ratio, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [fill, ratio]);

  useEffect(() => {
    if (!processing || uploading) return;
    const loop = Animated.loop(Animated.timing(shimmer, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [processing, shimmer, uploading]);

  const title = upload?.status === 'uploading'
    ? `Uploading ${upload.fileName}`
    : localFailure || failed > 0
      ? 'A video needs attention'
      : interrupted
        ? 'Upload paused — open listing to retry'
        : processing
          ? 'Preparing videos for your listing'
          : 'All videos ready — making listing live';
  const detail = upload?.status === 'uploading'
    ? `${upload.progress}% uploaded`
    : localFailure
      ? upload.error
      : failed > 0
      ? `${failed} video${failed === 1 ? '' : 's'} failed. Retry from Edit.`
      : interrupted
        ? `${statuses.length} of ${expected} videos received`
        : `${ready} of ${expected} videos ready to view`;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={localFailure || failed ? 'alert-circle' : 'cloud-upload'} size={17} color={localFailure || failed ? DesignColors.danger : DesignColors.primaryFixed} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
        </View>
        <Text style={styles.count}>{upload?.status === 'uploading' ? `${upload.progress}%` : `${ready}/${expected}`}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}>
          <LinearGradient colors={failed ? [DesignColors.errorContainer, DesignColors.danger] : [DesignColors.primaryContainer, DesignColors.primaryBright]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        {processing && !uploading ? (
          <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmer.interpolate({ inputRange: [0, 1], outputRange: [-110, 330] }) }] }]}>
            <LinearGradient colors={[DesignColors.transparent, 'rgba(255, 236, 208, 0.42)', DesignColors.transparent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        ) : null}
      </View>
      <Text style={styles.footer}>Customers will see this listing when every video is ready.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, gap: 10, backgroundColor: DesignColors.surfaceContainerHigh, borderWidth: 1, borderColor: DesignColors.primaryTintBorder },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primaryTint },
  copy: { flex: 1, gap: 3 },
  title: { ...DesignTypography.labelLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  detail: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  count: { ...DesignTypography.labelSm, color: DesignColors.primaryFixed, fontFamily, fontWeight: '800' },
  track: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: DesignColors.surfaceContainerLowest },
  fill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
  shimmer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 110 },
  footer: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
});
