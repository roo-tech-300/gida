import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { useAppToast } from '@/components/ui/toast-card';
import { WebBlurView } from '@/components/ui/web-blur-view';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { LISTING_VIDEO_LIMITS } from '@/constants/listing-video';
import { useCreateListingForm } from '@/context/create-listing-context';
import { useDeleteListingVideo } from '@/hooks/use-listing-videos';
import { pickListingMedia } from '@/utils/pick-listing-media';
import { countVideos, wizardMediaKey, type WizardMedia } from '@/types/wizard-media';
import { ListingMediaTile } from './listing-media-tile';

/** The wizard's gallery: photos and videos in one list, each removable. */
export function ListingMediaGrid({ listingId }: { listingId?: string }) {
  const { data, setStep5 } = useCreateListingForm();
  const { hero, gallery } = data.step5;
  const { showToast } = useAppToast();
  const alert = useCustomAlert();
  const deleteMutation = useDeleteListingVideo(listingId ?? '');
  const [picking, setPicking] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const heroVideoCount = hero && hero.kind !== 'photo' ? 1 : 0;
  const remainingVideos = Math.max(
    LISTING_VIDEO_LIMITS.maxPerListing - heroVideoCount - countVideos(gallery),
    0,
  );

  const addMedia = async () => {
    setPicking(true);
    try {
      const result = await pickListingMedia();
      if (result.kind === 'denied') {
        alert.showAlert({
          title: 'Permission required',
          message: 'Please allow media access to add photos and videos.',
          buttons: [{ label: 'OK', style: 'primary' }],
        });
        return;
      }
      if (result.kind === 'invalid') {
        showToast({ message: result.message, type: 'error' });
        return;
      }
      if (result.kind !== 'picked') return;

      const photos = result.media.filter((item) => item.kind === 'photo');
      const videos = result.media.filter((item) => item.kind !== 'photo');
      const allowedVideos = videos.slice(0, remainingVideos);
      if (allowedVideos.length < videos.length) {
        const message =
          remainingVideos === 0
            ? photos.length > 0
              ? `You already have ${LISTING_VIDEO_LIMITS.maxPerListing} videos. Photos were added; the videos were skipped.`
              : `You already have ${LISTING_VIDEO_LIMITS.maxPerListing} videos on this listing.`
            : `You can add ${remainingVideos} more video${remainingVideos === 1 ? '' : 's'}. The rest were skipped.`;
        showToast({ message, type: 'error' });
      }
      setStep5({ gallery: [...gallery, ...photos, ...allowedVideos] });
    } catch (error) {
      console.error('[ListingMediaGrid] Failed to add media:', error);
      showToast({ message: 'Could not open the media picker. Please try again.', type: 'error' });
    } finally {
      setPicking(false);
    }
  };

  const removeMedia = (media: WizardMedia, index: number) => {
    const drop = () => setStep5({ gallery: gallery.filter((_, itemIndex) => itemIndex !== index) });

    if (media.kind !== 'uploaded-video' || !listingId) {
      drop();
      return;
    }

    alert.showAlert({
      title: 'Delete this video?',
      message: 'It will be removed from this listing. This cannot be undone.',
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        {
          label: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDeletingId(media.video.id);
            deleteMutation.mutate(media.video.id, {
              onSuccess: () => {
                drop();
                showToast({ message: 'Video deleted.', type: 'success' });
              },
              onError: (error) => {
                console.error('[ListingMediaGrid] Failed to delete a video:', error);
                showToast({ message: error.message || 'Could not delete the video.', type: 'error' });
              },
              onSettled: () => setDeletingId(null),
            });
          },
        },
      ],
    });
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Gallery Media</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.grid}>
        <Pressable style={styles.addSlot} onPress={addMedia} disabled={picking}>
          <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
          {picking ? (
            <ActivityIndicator color={DesignColors.primary} />
          ) : (
            <View style={styles.placeholderBody}>
              <View style={styles.placeholderIconWrap}>
                <Ionicons name="add" size={26} color={DesignColors.primary} />
              </View>
              <Text style={styles.placeholderLabel}>Add Photos & Videos</Text>
            </View>
          )}
        </Pressable>

        {gallery.map((media, index) => (
          <View key={wizardMediaKey(media, index)} style={styles.slot}>
            <ListingMediaTile
              media={media}
              label={`#${index + 1}`}
              isRemoving={media.kind === 'uploaded-video' && deletingId === media.video.id}
              onRemove={() => removeMedia(media, index)}
            />
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        Up to {LISTING_VIDEO_LIMITS.maxPerListing} videos, {LISTING_VIDEO_LIMITS.maxDurationSeconds / 60}{' '}
        minutes each. Photos and videos appear together on the listing.
      </Text>

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
  section: { gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  line: { height: 1, flex: 1, backgroundColor: DesignColors.cardBorder },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  glassBlur: { ...StyleSheet.absoluteFill, borderRadius: 16 },
  addSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.glassFill,
  },
  slot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
  },
  placeholderBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 10 },
  placeholderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  placeholderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
  hint: {
    ...DesignTypography.bodyMd,
    fontSize: 13,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
    paddingHorizontal: 4,
  },
});
