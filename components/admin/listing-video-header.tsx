import { StyleSheet, Text } from 'react-native';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { LISTING_VIDEO_LIMITS } from '@/constants/listing-video';

/** Title and limits for the walkthrough video section; `note` adds a sentence. */
export function ListingVideoHeader({ note }: { note?: string }) {
  return (
    <>
      <Text style={styles.title}>Walkthrough Videos</Text>
      <Text style={styles.hint}>
        Short walkthroughs convert better than photos alone. Up to {LISTING_VIDEO_LIMITS.maxPerListing} videos,{' '}
        {LISTING_VIDEO_LIMITS.maxDurationSeconds / 60} minutes each.{note ? ` ${note}` : ''}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily },
  hint: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20 },
});
