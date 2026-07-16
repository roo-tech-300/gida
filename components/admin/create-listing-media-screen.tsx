import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { ListingGalleryPickerModal } from '@/components/admin/listing-gallery-picker-modal';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';
import { useCreateListing } from '@/hooks/use-create-listing';
import { uploadListingImage, updateListingPrimaryImage, insertListingPhotos } from '@/services/listing-service';
import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';

export function CreateListingMediaScreen() {
  const { data, setStep5, reset } = useCreateListingForm();
  const { step5, step1, step2, step3, step4 } = data;
  const { mutateAsync, isPending } = useCreateListing();
  const { showToast } = useAppToast();
  const { profile } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [heroLoading, setHeroLoading] = useState(false);

  const pickHero = async () => {
    setHeroLoading(true);
    try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo access to pick an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setStep5({ heroImage: uri, galleryImages: [uri, ...step5.galleryImages] });
    }
    } finally {
      setHeroLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!step1.title.trim()) {
      showToast({ message: 'Title is required. Go back to step 1.', type: 'error' });
      return;
    }
    if (!step1.landlordId) {
      showToast({ message: 'Please select a landlord in step 1.', type: 'error' });
      return;
    }
    if (!step1.layoutType) {
      showToast({ message: 'Please select a layout type in step 1.', type: 'error' });
      return;
    }
    if (!step1.price) {
      showToast({ message: 'Please enter a price in step 1.', type: 'error' });
      return;
    }
    if (!step2.coords) {
      showToast({ message: 'Please lock the GPS location in step 2.', type: 'error' });
      return;
    }
    if (!step2.selectedSchool) {
      showToast({ message: 'Please select a school in step 2.', type: 'error' });
      return;
    }
    if (!step5.heroImage && step5.galleryImages.length === 0) {
      showToast({ message: 'Please add at least one photo.', type: 'error' });
      return;
    }

    setIsPublishing(true);

    try {
      const listingInput = {
        admin_id: profile?.id || '',
        title: step1.title.trim(),
        description: step1.description.trim() || null,
        landlord_id: step1.landlordId,
        category: 'student_housing',
        layout_type: step1.layoutType,
        price_amount: parseFloat(step1.price.replace(/,/g, '')),
        lease_term: step1.term,
        units_available: step1.units,
        number_of_bedrooms: step1.bedrooms,
        number_of_bathrooms: step1.bathrooms,
        max_roommates: step4.noLimit ? 999 : step4.maxRoommates,
        rules: step4.rulesList,
        location_landmark: step2.landmark.trim(),
        city: profile?.city || 'Minna',
        campus: step2.selectedCampus || step2.selectedSchool,
        latitude: step2.coords.latitude,
        longitude: step2.coords.longitude,
        is_shared_bathroom: step3.selectedAmenities.includes('is_shared_bathroom'),
        is_shared_kitchen: step3.selectedAmenities.includes('is_shared_kitchen'),
        has_borehole: step3.selectedAmenities.includes('has_borehole'),
        has_generator: step3.selectedAmenities.includes('has_generator'),
        has_fenced_gate: step3.selectedAmenities.includes('has_fenced_gate'),
        has_internet: step3.selectedAmenities.includes('has_internet'),
        has_burglary: step3.selectedAmenities.includes('has_burglary'),
        has_cabinet: step3.selectedAmenities.includes('has_cabinet'),
        has_wardrobe: step3.selectedAmenities.includes('has_wardrobe'),
        custom_features: step3.featuresList,
        size_sqft: (() => {
          const num = parseFloat(step1.sizeValue.replace(/,/g, ''));
          if (isNaN(num)) return null;
          return step1.sizeUnit === 'sqm' ? Math.round(num * 10.7639) : Math.round(num);
        })(),
        total_floors: step1.isStoreyBuilding ? step1.totalFloors : null,
      };

      const { id } = await mutateAsync(listingInput);

      let primaryUrl = null;
      if (step5.heroImage) {
        primaryUrl = await uploadListingImage(id, step5.heroImage, 'hero.jpg');
        await updateListingPrimaryImage(id, primaryUrl);
      }

      if (step5.galleryImages.length > 0) {
        const uploads = step5.galleryImages.map((uri, i) =>
          uploadListingImage(id, uri, `gallery/${i}.jpg`)
        );
        const galleryUrls = await Promise.all(uploads);

        const photos = galleryUrls.map((url, i) => ({
          listing_id: id,
          image_url: url,
          display_order: i + 1,
        }));
        await insertListingPhotos(photos);
      }

      showToast({ message: 'Listing published successfully!', type: 'success' });
      reset();
      router.replace('/admin/total-inventory');
    } catch (error: any) {
      const msg = error?.message || String(error);
      console.log('=== PUBLISH ERROR ===');
      console.log('message:', msg);
      console.log('stack:', error?.stack);
      console.log('name:', error?.name);
      console.log('code:', error?.code);
      console.log('details:', error?.details);
      console.log('hint:', error?.hint);
      try { console.log('fullError:', JSON.stringify(error, Object.getOwnPropertyNames(error))); } catch (_) {}
      showToast({ message: msg || 'Failed to publish listing.', type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#0e0e10' }}
      >
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.stepIndicator}>Step 5 of 5</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Property Media</Text>
            <Text style={styles.heroSub}>Add high-quality photos to attract tenants</Text>
          </View>

          <View style={styles.heroSection}>
            {step5.heroImage ? (
              <View style={styles.heroImageWrap}>
                <Image source={{ uri: step5.heroImage }} style={styles.heroFilledImage} />
                <Pressable style={styles.heroRemove} onPress={() => setStep5({ heroImage: null })}>
                  <Ionicons name="close-circle" size={22} color={DesignColors.error} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.heroUpload} onPress={pickHero} disabled={heroLoading}>
                <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
                {heroLoading ? (
                  <ActivityIndicator size="large" color={DesignColors.primary} />
                ) : (
                  <>
                    <View style={styles.heroIconWrap}>
                      <Ionicons name="camera-outline" size={28} color={DesignColors.primary} />
                    </View>
                    <Text style={styles.heroUploadText}>Upload Primary Hero Image</Text>
                  </>
                )}
              </Pressable>
            )}
            <Text style={styles.heroHint}>
              This will be the first image potential tenants see. High-resolution landscape photos work best.
            </Text>
          </View>

          <View style={styles.gallerySection}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>Additional Gallery Photos</Text>
              <View style={styles.galleryLine} />
            </View>

            <View style={styles.galleryGrid}>
              <Pressable style={styles.galleryAddSlot} onPress={() => setPickerOpen(true)}>
                <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
                <View style={styles.placeholderBody}>
                  <View style={styles.placeholderIconWrap}>
                    <Ionicons name="camera-outline" size={26} color={DesignColors.primary} />
                  </View>
                  <Text style={styles.placeholderLabel}>Add Photos</Text>
                </View>
              </Pressable>

              {step5.galleryImages.map((uri, i) => (
                <View key={`${uri}-${i}`} style={styles.gallerySlot}>
                  <Image source={{ uri }} style={styles.galleryImage} />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>#{i + 1}</Text>
                  </View>
                  <Pressable style={styles.removeOverlay} onPress={() => setStep5({ galleryImages: step5.galleryImages.filter((_, idx) => idx !== i) })}>
                    <Ionicons name="close-circle" size={20} color={DesignColors.error} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

        </ScrollView>

        <View style={styles.ctaRow}>
          <Pressable style={styles.ctaBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={DesignColors.onPrimaryContainer} />
          </Pressable>
          <Pressable style={styles.publishBtn} onPress={handlePublish} disabled={isPublishing}>
            <View style={{ opacity: isPublishing ? 0 : 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={styles.publishText}>Publish Listing</Text>
              <View style={styles.publishIconWrap}>
                <Ionicons name="cloud-upload-outline" size={22} color={DesignColors.onPrimaryContainer} />
              </View>
            </View>
            {isPublishing && (
              <ActivityIndicator color={DesignColors.onPrimaryContainer} style={StyleSheet.absoluteFill} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <ListingGalleryPickerModal
        visible={pickerOpen}
        selectedImages={step5.galleryImages}
        onClose={() => setPickerOpen(false)}
        onDone={(images) => {
          setStep5({ galleryImages: images });
          setPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e10' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  stepIndicator: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  glassBlur: { ...StyleSheet.absoluteFillObject, borderRadius: 16 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24, paddingBottom: 24 },
  hero: { paddingTop: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.5 },
  heroSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 4 },
  heroSection: { gap: 12 },
  heroUpload: {
    height: 192, borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(24,24,28,0.65)',
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  heroImageWrap: { height: 192, borderRadius: 16, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroFilledImage: { width: '100%', height: '100%' },
  heroRemove: { position: 'absolute', top: 8, right: 8 },
  heroIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(195,192,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  heroUploadText: { fontSize: 16, fontWeight: '500', color: DesignColors.onSurface, fontFamily },
  heroHint: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20, paddingHorizontal: 4 },
  gallerySection: { gap: 16 },
  galleryHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  galleryTitle: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 0.5, textTransform: 'uppercase' },
  galleryLine: { height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  galleryAddSlot: {
    width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(195,192,255,0.2)', position: 'relative',
    backgroundColor: 'rgba(24,24,28,0.85)',
  },
  gallerySlot: {
    width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: 'relative',
  },
  galleryImage: { width: '100%', height: '100%' },
  placeholderBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 10,
  },
  placeholderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(195,192,255,0.1)',
  },
  placeholderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
  badge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(53,52,55,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', color: DesignColors.primary, fontFamily },
  removeOverlay: { position: 'absolute', top: 4, right: 4 },

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
  publishText: { fontSize: 16, fontWeight: '700', color: DesignColors.onPrimaryContainer, fontFamily },
  publishIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
});
