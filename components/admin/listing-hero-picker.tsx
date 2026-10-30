import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';
import { useAppToast } from '@/components/ui/toast-card';
import { WebBlurView } from '@/components/ui/web-blur-view';
import { DesignColors, fontFamily } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from '@/utils/web-image-picker';

/** The wizard's primary hero image; picking one also puts it first in the gallery. */
export function ListingHeroPicker() {
  const { data, setStep5 } = useCreateListingForm();
  const { heroImage, galleryImages } = data.step5;
  const { showToast } = useAppToast();
  const permissionAlert = useCustomAlert();
  const [loading, setLoading] = useState(false);

  const pickHero = async () => {
    setLoading(true);
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
      const result = await launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.9 });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setStep5({ heroImage: uri, galleryImages: [uri, ...galleryImages] });
      }
    } catch (error) {
      console.error('[ListingHeroPicker] Failed to pick a hero image:', error);
      showToast({ message: 'Could not open that image. Please try another one.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      {heroImage ? (
        <View style={styles.imageWrap}>
          <Image source={{ uri: heroImage }} style={styles.image} />
          <Pressable style={styles.remove} onPress={() => setStep5({ heroImage: null })}>
            <Ionicons name="close-circle" size={22} color={DesignColors.error} />
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
                <Ionicons name="camera-outline" size={28} color={DesignColors.primary} />
              </View>
              <Text style={styles.uploadText}>Upload Primary Hero Image</Text>
            </>
          )}
        </Pressable>
      )}
      <Text style={styles.hint}>
        This will be the first image potential tenants see. High-resolution landscape photos work best.
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
  glassBlur: { ...StyleSheet.absoluteFill, borderRadius: 16 },
  upload: {
    height: 192, borderRadius: 16, overflow: 'hidden',
    backgroundColor: DesignColors.glassBg,
    borderWidth: 2, borderStyle: 'dashed', borderColor: DesignColors.glassBorder,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  imageWrap: { height: 192, borderRadius: 16, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: DesignColors.glassBorder },
  image: { width: '100%', height: '100%' },
  remove: { position: 'absolute', top: 8, right: 8 },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: DesignColors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  uploadText: { fontSize: 16, fontWeight: '500', color: DesignColors.onSurface, fontFamily },
  hint: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20, paddingHorizontal: 4 },
});
