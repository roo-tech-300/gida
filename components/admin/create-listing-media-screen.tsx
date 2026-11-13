import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { WebBlurView } from '@/components/ui/web-blur-view';
import { requestMediaLibraryPermissionsAsync, launchImageLibraryAsync } from '@/utils/web-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { ListingGalleryPickerModal } from '@/components/admin/listing-gallery-picker-modal';
import { DesignColors } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';
import { useExitListingWizard } from '@/hooks/use-exit-listing-wizard';
import { useSaveListing } from '@/hooks/use-save-listing';

import { styles } from './create-listing-media-screen.styles';

export function CreateListingMediaScreen() {
  const { data, setStep5, editListingId } = useCreateListingForm();
  const { step5 } = data;
  const { publish: handlePublish, isPublishing } = useSaveListing();
  const exitWizard = useExitListingWizard();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [heroLoading, setHeroLoading] = useState(false);
  const permissionAlert = useCustomAlert();

  const isEditing = editListingId !== null;

  const pickHero = async () => {
    setHeroLoading(true);
    try {
    const permission = await requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      permissionAlert.showAlert({
        title: 'Permission required',
        message: 'Please allow photo access to pick an image.',
        buttons: [{ label: 'OK', style: 'primary' }],
      });
      return;
    }
    const result = await launchImageLibraryAsync({
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SafeKeyboardView
        style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }}
      >
        <View style={styles.topBar}>
          <BackButton hasBackground={false} onPress={exitWizard} />
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
                <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
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
                <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
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
              <Text style={styles.publishText}>{isEditing ? 'Save Changes' : 'Publish Listing'}</Text>
              <View style={styles.publishIconWrap}>
                <Ionicons name={isEditing ? 'checkmark-outline' : 'cloud-upload-outline'} size={22} color={DesignColors.onPrimaryContainer} />
              </View>
            </View>
            {isPublishing && (
              <ActivityIndicator color={DesignColors.onPrimaryContainer} style={StyleSheet.absoluteFill} />
            )}
          </Pressable>
        </View>
      </SafeKeyboardView>
      <ListingGalleryPickerModal
        visible={pickerOpen}
        selectedImages={step5.galleryImages}
        onClose={() => setPickerOpen(false)}
        onDone={(images) => {
          setStep5({ galleryImages: images });
          setPickerOpen(false);
        }}
      />
      <CustomAlert visible={permissionAlert.visible} title={permissionAlert.title} message={permissionAlert.message} buttons={permissionAlert.buttons} onDismiss={permissionAlert.hideAlert} />
    </SafeAreaView>
  );
}
