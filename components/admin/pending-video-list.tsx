import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { DesignColors, DesignSpacing } from '@/constants/design';
import { LISTING_VIDEO_LIMITS } from '@/constants/listing-video';
import { usePickListingVideo } from '@/hooks/use-pick-listing-video';
import type { PickedVideo } from '@/utils/pick-listing-video';
import { AddVideoButton } from './add-video-button';
import { ListingVideoHeader } from './listing-video-header';
import { VideoRowLayout } from './video-row-layout';

type Props = {
  videos: PickedVideo[];
  onChange: (videos: PickedVideo[]) => void;
};

/** Videos picked for a listing that doesn't exist yet; they upload after Publish. */
export function PendingVideoList({ videos, onChange }: Props) {
  const alert = useCustomAlert();
  const pickVideo = usePickListingVideo(alert);
  const atLimit = videos.length >= LISTING_VIDEO_LIMITS.maxPerListing;

  const addVideo = async () => {
    const video = await pickVideo();
    if (video) onChange([...videos, video]);
  };

  return (
    <View style={styles.section}>
      <ListingVideoHeader note="They upload after you publish; keep the app open until they finish." />

      {videos.map((video, index) => (
        <VideoRowLayout
          key={`${video.fileName}-${index}`}
          thumbnail={<Ionicons name="videocam-outline" size={24} color={DesignColors.primary} />}
          durationSeconds={video.durationSeconds}
          title={video.fileName}
          status="Uploads when you publish"
          removeIcon="close"
          removeLabel={`Remove ${video.fileName}`}
          onRemove={() => onChange(videos.filter((_, i) => i !== index))}
        />
      ))}

      <AddVideoButton onPress={addVideo} disabled={atLimit} atLimit={atLimit} />

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
  section: { gap: DesignSpacing.sm },
});
