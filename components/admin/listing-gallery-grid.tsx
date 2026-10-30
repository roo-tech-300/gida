import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ListingGalleryPickerModal } from '@/components/admin/listing-gallery-picker-modal';
import { WebBlurView } from '@/components/ui/web-blur-view';
import { DesignColors, fontFamily } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';

/** The wizard's additional gallery photos, with an add slot and per-photo remove. */
export function ListingGalleryGrid() {
  const { data, setStep5 } = useCreateListingForm();
  const { galleryImages } = data.step5;
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Additional Gallery Photos</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.grid}>
        <Pressable style={styles.addSlot} onPress={() => setPickerOpen(true)}>
          <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
          <View style={styles.placeholderBody}>
            <View style={styles.placeholderIconWrap}>
              <Ionicons name="camera-outline" size={26} color={DesignColors.primary} />
            </View>
            <Text style={styles.placeholderLabel}>Add Photos</Text>
          </View>
        </Pressable>

        {galleryImages.map((uri, i) => (
          <View key={`${uri}-${i}`} style={styles.slot}>
            <Image source={{ uri }} style={styles.image} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>#{i + 1}</Text>
            </View>
            <Pressable
              style={styles.removeOverlay}
              onPress={() => setStep5({ galleryImages: galleryImages.filter((_, idx) => idx !== i) })}
            >
              <Ionicons name="close-circle" size={20} color={DesignColors.error} />
            </Pressable>
          </View>
        ))}
      </View>

      <ListingGalleryPickerModal
        visible={pickerOpen}
        selectedImages={galleryImages}
        onClose={() => setPickerOpen(false)}
        onDone={(images) => {
          setStep5({ galleryImages: images });
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 0.5, textTransform: 'uppercase' },
  line: { height: 1, flex: 1, backgroundColor: DesignColors.cardBorder },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  glassBlur: { ...StyleSheet.absoluteFill, borderRadius: 16 },
  addSlot: {
    width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: DesignColors.primaryContainer, position: 'relative',
    backgroundColor: DesignColors.glassFill,
  },
  slot: {
    width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: DesignColors.glassBorder, position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  placeholderBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 10 },
  placeholderIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  placeholderLabel: { fontSize: 11, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
  badge: { position: 'absolute', top: 6, left: 6, backgroundColor: DesignColors.surfaceContainerHighest, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', color: DesignColors.primary, fontFamily },
  removeOverlay: { position: 'absolute', top: 4, right: 4 },
});
