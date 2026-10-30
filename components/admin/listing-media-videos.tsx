import { StyleSheet, View } from 'react-native';

import { useCreateListingForm } from '@/context/create-listing-context';
import { DesignSpacing } from '@/constants/design';
import { ListingVideoManager } from './listing-video-manager';
import { PendingVideoList } from './pending-video-list';
import { ToggleRow } from './tour-enablement-toggle';

/**
 * Walkthrough videos on the wizard's media step. Editing uploads straight to
 * the existing listing; a new listing queues them until Publish creates it.
 */
export function ListingMediaVideos() {
  const { data, setStep5, editListingId } = useCreateListingForm();
  const { pendingVideos, videoCoverEnabled } = data.step5;

  return (
    <View style={styles.section}>
      {editListingId ? (
        <ListingVideoManager listingId={editListingId} />
      ) : (
        <PendingVideoList videos={pendingVideos} onChange={(videos) => setStep5({ pendingVideos: videos })} />
      )}
      <ToggleRow
        label="Use video as cover"
        description="Feed cards play the first video's 8-second preview instead of showing the hero photo."
        enabled={videoCoverEnabled}
        onToggle={() => setStep5({ videoCoverEnabled: !videoCoverEnabled })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: DesignSpacing.md },
});
