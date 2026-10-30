import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { AddVideoButton } from '@/components/admin/add-video-button';
import { ListingVideoHeader } from '@/components/admin/listing-video-header';
import { ListingVideoRow } from '@/components/admin/listing-video-row';
import { ListingVideoUploadCard } from '@/components/admin/listing-video-upload-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { LISTING_VIDEO_LIMITS } from '@/constants/listing-video';
import { useListingVideoActions } from '@/hooks/use-listing-video-actions';
import { useListingVideos } from '@/hooks/use-listing-videos';

export function ListingVideoManager({ listingId }: { listingId: string }) {
  const alert = useCustomAlert();
  const { data: videos = [], isLoading, isError, refetch } = useListingVideos(listingId);
  const { upload, cancel, dismiss, addVideo, confirmDelete, deletingId } = useListingVideoActions(listingId, alert);

  const activeCount = videos.filter((video) => video.status !== 'failed').length;
  const isUploading = upload?.status === 'uploading';
  const atLimit = activeCount >= LISTING_VIDEO_LIMITS.maxPerListing;
  const canAdd = !isLoading && !isError && !isUploading && !atLimit;

  return (
    <View style={styles.section}>
      <ListingVideoHeader />

      {isLoading ? <ActivityIndicator color={DesignColors.primary} style={styles.loader} /> : null}

      {isError ? (
        <Pressable style={styles.errorBox} onPress={() => refetch()} accessibilityRole="button">
          <Ionicons name="refresh" size={18} color={DesignColors.danger} />
          <Text style={styles.errorText}>Could not load videos. Tap to retry.</Text>
        </Pressable>
      ) : null}

      {videos.map((video, index) => (
        <ListingVideoRow
          key={video.id}
          video={video}
          index={index}
          isDeleting={deletingId === video.id}
          onDelete={() => confirmDelete(video)}
        />
      ))}

      {upload ? <ListingVideoUploadCard upload={upload} onCancel={cancel} onDismiss={dismiss} /> : null}

      <AddVideoButton onPress={addVideo} disabled={!canAdd} atLimit={atLimit} />

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onDismiss={alert.hideAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: DesignSpacing.sm, marginBottom: DesignSpacing.xl },
  loader: { paddingVertical: DesignSpacing.md },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.dangerContainer,
  },
  errorText: { ...DesignTypography.bodyMd, color: DesignColors.danger, fontFamily },
});
