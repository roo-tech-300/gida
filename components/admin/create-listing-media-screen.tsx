import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { ListingHeroMediaPicker } from '@/components/admin/listing-hero-media-picker';
import { ListingMediaGrid } from '@/components/admin/listing-media-grid';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';
import { useExitListingWizard } from '@/hooks/use-exit-listing-wizard';
import { usePublishListing } from '@/hooks/use-publish-listing';

export function CreateListingMediaScreen() {
  const exitWizard = useExitListingWizard();
  const { publish, isPublishing, isEditing } = usePublishListing();
  const { editListingId } = useCreateListingForm();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SafeKeyboardView style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }}>
        <View style={styles.topBar}>
          <BackButton hasBackground={false} onPress={exitWizard} />
          <Text style={styles.stepIndicator}>Step 5 of 5</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Property Media</Text>
            <Text style={styles.heroSub}>
              Add photos and videos. Pick a cover — a photo or a short video — and mix the rest into the gallery.
            </Text>
          </View>

          <ListingHeroMediaPicker />
          <ListingMediaGrid listingId={editListingId ?? undefined} />
        </ScrollView>

        <View style={styles.ctaRow}>
          <Pressable style={styles.ctaBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={DesignColors.onPrimaryContainer} />
          </Pressable>
          <Pressable style={styles.publishBtn} onPress={publish} disabled={isPublishing}>
            <View style={[styles.publishInner, { opacity: isPublishing ? 0 : 1 }]}>
              <Text style={styles.publishText}>{isEditing ? 'Save Changes' : 'Publish Listing'}</Text>
              <View style={styles.publishIconWrap}>
                <Ionicons
                  name={isEditing ? 'checkmark-outline' : 'cloud-upload-outline'}
                  size={22}
                  color={DesignColors.onPrimaryContainer}
                />
              </View>
            </View>
            {isPublishing && (
              <ActivityIndicator color={DesignColors.onPrimaryContainer} style={StyleSheet.absoluteFill} />
            )}
          </Pressable>
        </View>
      </SafeKeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  stepIndicator: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24, paddingBottom: 24 },
  hero: { paddingTop: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.5 },
  heroSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 4 },
  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  ctaBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer, alignItems: 'center', justifyContent: 'center',
    shadowColor: DesignColors.primaryContainer,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  publishBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: DesignColors.primaryContainer, borderRadius: 9999,
    paddingLeft: 24, paddingRight: 6, paddingVertical: 6,
    shadowColor: DesignColors.primaryContainer,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  publishInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  publishText: { fontSize: 16, fontWeight: '700', color: DesignColors.onPrimaryContainer, fontFamily },
  publishIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: DesignColors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
});
