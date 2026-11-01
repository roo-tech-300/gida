import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { useAppToast } from '@/components/ui/toast-card';
import { WebBlurView } from '@/components/ui/web-blur-view';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { LISTING_VIDEO_LIMITS } from '@/constants/listing-video';
import { useCreateListingForm } from '@/context/create-listing-context';
import { pickListingMedia } from '@/utils/pick-listing-media';
import { countVideos, type WizardMedia } from '@/types/wizard-media';
import { ListingMediaTile } from './listing-media-tile';

function isAlreadyInGallery(hero: WizardMedia, gallery: WizardMedia[]): boolean {
  if (hero.kind === 'photo') return gallery.some((item) => item.kind === 'photo' && item.uri === hero.uri);
  if (hero.kind === 'video') {
    return gallery.some((item) => item.kind === 'video' && item.video === hero.video);
  }
  return gallery.some((item) => item.kind === 'uploaded-video' && item.video.id === hero.video.id);
}

/** The wizard's cover picker: a photo or a video, whichever students should see first. */
export function ListingHeroMediaPicker() {
  const { data, setStep5 } = useCreateListingForm();
  const { hero, gallery } = data.step5;
  const { showToast } = useAppToast();
  const permissionAlert = useCustomAlert();
  const [loading, setLoading] = useState(false);

  const pickHero = async () => {
    setLoading(true);
    try {
      const result = await pickListingMedia({ multiple: false });
      if (result.kind === 'denied') {
        permissionAlert.showAlert({
          title: 'Permission required',
          message: 'Please allow media access to pick a cover photo or video.',
          buttons: [{ label: 'OK', style: 'primary' }],
        });
        return;
      }
      if (result.kind === 'invalid') {
        showToast({ message: result.message, type: 'error' });
        return;
      }
      if (result.kind !== 'picked') return;

      const next = result.media[0];
      // Replacing the cover keeps the old one as gallery media, so the limit
      // must count the gallery as it will look after the swap.
      const carryOver = hero && !isAlreadyInGallery(hero, gallery) ? [hero] : [];
      const nextGallery = [...carryOver, ...gallery];
      if (next.kind !== 'photo' && countVideos(nextGallery) >= LISTING_VIDEO_LIMITS.maxPerListing) {
        showToast({
          message: `You can have up to ${LISTING_VIDEO_LIMITS.maxPerListing} videos on a listing. Remove one before choosing a new cover.`,
          type: 'error',
        });
        return;
      }

      setStep5({ hero: next, gallery: nextGallery });
    } catch (error) {
      console.error('[ListingHeroMediaPicker] Failed to pick the cover media:', error);
      showToast({ message: 'Could not open that file. Please try another one.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const removeHero = () => {
    if (!hero) return;
    // Uploaded videos live on the server; keep them in the gallery instead of
    // dropping them from the listing.
    const nextGallery = hero.kind === 'uploaded-video' ? [hero, ...gallery] : gallery;
    setStep5({ hero: null, gallery: nextGallery });
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Cover Media</Text>
        <View style={styles.line} />
      </View>

      {hero ? (
        <View style={styles.heroBlock}>
          <View style={styles.heroWrap}>
            <ListingMediaTile media={hero} isHero onRemove={removeHero} />
          </View>
          <Pressable
            style={styles.changeBtn}
            onPress={pickHero}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Change cover photo or video"
          >
            {loading ? (
              <ActivityIndicator size="small" color={DesignColors.primary} />
            ) : (
              <>
                <Ionicons name="swap-horizontal" size={16} color={DesignColors.primary} />
                <Text style={styles.changeText}>Change Cover</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.upload} onPress={pickHero} disabled={loading}>
          <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
          {loading ? (
            <ActivityIndicator size="large" color={DesignColors.primary} />
          ) : (
            <>
              <View style={styles.iconWrap}>
                <Ionicons name="images-outline" size={28} color={DesignColors.primary} />
              </View>
              <Text style={styles.uploadText}>Upload Cover Photo or Video</Text>
            </>
          )}
        </Pressable>
      )}

      <Text style={styles.hint}>
        This is the first thing students see. A high-resolution photo or a short video works best.
      </Text>

      <CustomAlert
        visible={permissionAlert.visible}
        title={permissionAlert.title}
        message={permissionAlert.message}
        buttons={permissionAlert.buttons}
        onDismiss={permissionAlert.hideAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
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
  glassBlur: { ...StyleSheet.absoluteFill, borderRadius: 16 },
  upload: {
    height: 192,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: DesignColors.glassBg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: DesignColors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  heroBlock: { gap: 10 },
  heroWrap: {
    height: 192,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
  },
  changeBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryContainer,
  },
  changeText: { fontSize: 13, fontWeight: '600', color: DesignColors.primary, fontFamily },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { fontSize: 16, fontWeight: '500', color: DesignColors.onSurface, fontFamily },
  hint: {
    ...DesignTypography.bodyMd,
    fontSize: 13,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
    paddingHorizontal: 4,
  },
});
