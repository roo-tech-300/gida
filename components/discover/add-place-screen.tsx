import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingGalleryPickerModal } from '@/components/admin/listing-gallery-picker-modal';
import { AddPlaceAuthGate } from '@/components/discover/add-place-auth-gate';
import { AddPlaceCategoryPicker } from '@/components/discover/add-place-category-picker';
import { AddPlaceField, AddPlaceInput } from '@/components/discover/add-place-field';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { PLACE_ADDRESS_MAX, PLACE_AREA_MAX, PLACE_DESCRIPTION_MAX, PLACE_NAME_MAX } from '@/constants/place-form';
import { useAuth } from '@/context/auth-context';
import { useAddPlaceForm } from '@/hooks/use-add-place-form';

export function AddPlaceScreen() {
  const { profile, isAuthenticated } = useAuth();
  const form = useAddPlaceForm(profile?.id);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const hasCoords = form.draft.latitude != null && form.draft.longitude != null;

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <AddPlaceAuthGate />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <SafeKeyboardView style={styles.flex}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel and go back"
            onPress={() => router.back()}
            style={styles.headerBack}
          >
            <Ionicons name="close" size={22} color={DesignColors.textSecondary} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Create Place</Text>
            <Text style={styles.headerSubtitle}>Share a great spot with the Gida community</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Category ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="grid-outline" size={18} color={DesignColors.primaryFixed} />
              </View>
              <Text style={styles.sectionTitle}>Category</Text>
            </View>
            <Text style={styles.sectionDesc}>Pick the vibe that fits best</Text>
            <AddPlaceCategoryPicker value={form.draft.category} onChange={form.selectCategory} />
            {form.errors.category ? <Text style={styles.errorText}>{form.errors.category}</Text> : null}
          </View>

          {/* ── Basic Details ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="document-text-outline" size={18} color={DesignColors.primaryFixed} />
              </View>
              <Text style={styles.sectionTitle}>Basic Details</Text>
            </View>
            <AddPlaceField label="Place Name *" error={form.errors.name}>
              <AddPlaceInput
                autoCapitalize="words"
                invalid={Boolean(form.errors.name)}
                maxLength={PLACE_NAME_MAX}
                placeholder="e.g. Kilimanjaro, The Study Room"
                value={form.draft.name}
                onChangeText={(v) => form.updateDraft('name', v)}
              />
            </AddPlaceField>
            <AddPlaceField label="Area / Neighbourhood *" error={form.errors.area}>
              <AddPlaceInput
                autoCapitalize="words"
                invalid={Boolean(form.errors.area)}
                maxLength={PLACE_AREA_MAX}
                placeholder="e.g. Gidan Kwano, Bosso, Tunga"
                value={form.draft.area}
                onChangeText={(v) => form.updateDraft('area', v)}
              />
            </AddPlaceField>
            <AddPlaceField label="Street Address (Optional)" error={form.errors.address}>
              <AddPlaceInput
                autoCapitalize="sentences"
                invalid={Boolean(form.errors.address)}
                maxLength={PLACE_ADDRESS_MAX}
                placeholder="e.g. 12 Bosso Road, near Campus Gate"
                value={form.draft.address}
                onChangeText={(v) => form.updateDraft('address', v)}
              />
            </AddPlaceField>
            <AddPlaceField
              label="Description *"
              error={form.errors.description}
              hint={`${form.draft.description.length}/${PLACE_DESCRIPTION_MAX}`}
            >
              <AddPlaceInput
                multiline
                invalid={Boolean(form.errors.description)}
                maxLength={PLACE_DESCRIPTION_MAX}
                placeholder="Describe what makes this place special, study vibe, seating, menu or crowd..."
                value={form.draft.description}
                onChangeText={(v) => form.updateDraft('description', v)}
              />
            </AddPlaceField>
          </View>

          {/* ── Location ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="location-outline" size={18} color={DesignColors.primaryFixed} />
              </View>
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            <Text style={styles.sectionDesc}>Help people find their way here</Text>
            {hasCoords ? (
              <View style={styles.locationCard}>
                <View style={styles.locationRow}>
                  <Ionicons name="checkmark-circle" size={22} color={DesignColors.secondary} />
                  <View style={styles.locationTextWrap}>
                    <Text style={styles.locationTitle}>GPS coordinates added</Text>
                    <Text style={styles.locationCoords}>
                      {form.draft.latitude?.toFixed(5)}, {form.draft.longitude?.toFixed(5)}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={form.clearLocation} style={styles.locationAction}>
                  <Text style={styles.locationActionText}>Remove</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                disabled={form.isLocating}
                onPress={form.lockLocation}
                style={[styles.gpsButton, form.isLocating && styles.gpsButtonDisabled]}
              >
                <Ionicons name="navigate" size={18} color={DesignColors.onPrimary} />
                <Text style={styles.gpsButtonText}>{form.isLocating ? 'Getting location...' : 'Use Current Location'}</Text>
              </Pressable>
            )}
          </View>

          {/* ── Photos ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="images-outline" size={18} color={DesignColors.primaryFixed} />
              </View>
              <Text style={styles.sectionTitle}>Photos</Text>
            </View>
            <Text style={styles.sectionDesc}>Add high-quality photos to attract visitors</Text>

            {/* Gallery grid */}
            <View style={styles.gallerySection}>
              <View style={styles.galleryHeader}>
                <Text style={styles.galleryTitle}>Photos</Text>
                <View style={styles.galleryLine} />
              </View>
              <View style={styles.galleryGrid}>
                <Pressable style={styles.galleryAddSlot} onPress={() => setGalleryPickerOpen(true)}>
                  <View style={styles.placeholderBody}>
                    <View style={styles.placeholderIconWrap}>
                      <Ionicons name="camera-outline" size={26} color={DesignColors.primary} />
                    </View>
                    <Text style={styles.placeholderLabel}>Add Photos</Text>
                  </View>
                </Pressable>

                {form.galleryImages.map((uri, i) => (
                  <View key={`${uri}-${i}`} style={styles.gallerySlot}>
                    <Image source={{ uri }} style={styles.galleryImage} />
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>#{i + 1}</Text>
                    </View>
                    <Pressable
                      style={styles.removeOverlay}
                      onPress={() => form.removeGalleryImage(uri)}
                    >
                      <Ionicons name="close-circle" size={20} color={DesignColors.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            disabled={form.isSubmitting}
            onPress={() => router.back()}
            style={[styles.bottomButton, styles.cancelBtn]}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Publish place"
            disabled={form.isSubmitting}
            onPress={form.submit}
            style={[styles.bottomButton, styles.submitBtn]}
          >
            {form.isSubmitting ? (
              <ActivityIndicator size="small" color={DesignColors.onPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color={DesignColors.onPrimary} />
                <Text style={styles.submitBtnText}>Publish Place</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeKeyboardView>

      <ListingGalleryPickerModal
        visible={galleryPickerOpen}
        selectedImages={form.galleryImages}
        onClose={() => setGalleryPickerOpen(false)}
        onDone={(images) => {
          form.setGallery(images);
          setGalleryPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
    paddingBottom: DesignSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.cardBorder,
  },
  headerBack: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: 18, fontWeight: '800', color: DesignColors.textPrimary, fontFamily, letterSpacing: -0.3,
  },
  headerSubtitle: { fontSize: 12, color: DesignColors.textSecondary, fontFamily, marginTop: 2 },
  scrollContent: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.lg,
    paddingBottom: 120,
    gap: DesignSpacing.lg,
  },
  section: {
    gap: DesignSpacing.sm,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.xl,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  sectionIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: DesignColors.textPrimary, fontFamily, letterSpacing: -0.2,
  },
  sectionDesc: { fontSize: 12, color: DesignColors.textSecondary, fontFamily, marginTop: -2 },
  errorText: { fontSize: 12, color: DesignColors.error, fontFamily },
  // Location
  locationCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: DesignSpacing.sm, borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainer,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, flex: 1 },
  locationTextWrap: { flex: 1 },
  locationTitle: { fontSize: 13, fontWeight: '700', color: DesignColors.textPrimary, fontFamily },
  locationCoords: { fontSize: 11, color: DesignColors.textSecondary, fontFamily },
  locationAction: { paddingHorizontal: DesignSpacing.sm, paddingVertical: 6 },
  locationActionText: { fontSize: 12, fontWeight: '600', color: DesignColors.error, fontFamily },
  gpsButton: {
    height: 48, borderRadius: DesignRadius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: DesignSpacing.xs, backgroundColor: DesignColors.primary,
  },
  gpsButtonDisabled: { opacity: 0.7 },
  gpsButtonText: { fontSize: 14, fontWeight: '700', color: DesignColors.onPrimary, fontFamily },
  // Gallery
  gallerySection: { gap: 12, marginTop: 4 },
  galleryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  galleryTitle: {
    fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  galleryLine: { height: 1, flex: 1, backgroundColor: DesignColors.cardBorder },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  galleryAddSlot: {
    width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: DesignColors.primaryContainer,
    position: 'relative', backgroundColor: DesignColors.glassFill,
  },
  gallerySlot: {
    width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: DesignColors.glassBorder, position: 'relative',
  },
  galleryImage: { width: '100%', height: '100%' },
  placeholderBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 10 },
  placeholderIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  placeholderLabel: { fontSize: 11, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
  badge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: DesignColors.surfaceContainerHighest,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: DesignColors.primary, fontFamily },
  removeOverlay: { position: 'absolute', top: 4, right: 4 },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row', gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingVertical: DesignSpacing.sm,
    borderTopWidth: 1, borderTopColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  bottomButton: {
    flex: 1, height: 50, borderRadius: DesignRadius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: DesignSpacing.xs,
  },
  cancelBtn: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: DesignColors.textSecondary, fontFamily },
  submitBtn: { backgroundColor: DesignColors.primary },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: DesignColors.onPrimary, fontFamily },
});
