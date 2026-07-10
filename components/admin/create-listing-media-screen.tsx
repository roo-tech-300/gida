import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

const GALLERY_SIZE = 9;

export function CreateListingMediaScreen() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#0e0e10' }}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.stepLabel}>Step 4 of 4</Text>
            <Text style={styles.topBarTitle}>Property Media</Text>
          </View>
          <View style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            {heroImage ? (
              <View style={styles.heroImageWrap}>
                <Image source={{ uri: heroImage }} style={styles.heroFilledImage} />
                <Pressable style={styles.heroRemove} onPress={() => setHeroImage(null)}>
                  <Ionicons name="close-circle" size={22} color={DesignColors.error} />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.heroUpload} onPress={() => {}}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="camera-outline" size={32} color={DesignColors.primary} />
                </View>
                <Text style={styles.heroUploadText}>Upload Primary Hero Image</Text>
                <View style={styles.heroGlow} />
              </Pressable>
            )}
            <Text style={styles.heroHint}>
              This will be the first image potential buyers see. High-resolution landscape photos work best.
            </Text>
          </View>

          <View style={styles.gallerySection}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>Additional Gallery Photos</Text>
              <View style={styles.galleryLine} />
            </View>

            <View style={styles.galleryGrid}>
              {galleryImages.map((uri, i) => (
                <View key={`img-${i}`} style={styles.gallerySlot}>
                  <Image source={{ uri }} style={styles.galleryImage} />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>#{i + 1}</Text>
                  </View>
                  <Pressable
                    style={styles.removeOverlay}
                    onPress={() => setGalleryImages((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Ionicons name="close-circle" size={20} color={DesignColors.error} />
                  </Pressable>
                </View>
              ))}

              {galleryImages.length < GALLERY_SIZE && (
                <Pressable style={styles.addSlot} onPress={() => {}}>
                  <Ionicons name="add" size={28} color={DesignColors.onSurfaceVariant} />
                </Pressable>
              )}

              {Array.from({ length: Math.max(0, GALLERY_SIZE - galleryImages.length - 1) }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.emptySlot}>
                  <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.05)" />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIconWrap}>
              <Ionicons name="bulb-outline" size={20} color={DesignColors.secondary} />
            </View>
            <View style={styles.tipBody}>
              <Text style={styles.tipTitle}>Pro Tip</Text>
              <Text style={styles.tipText}>
                Properties with high-quality photos receive 4x more engagement. Ensure kitchen and bathrooms are well-lit.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.ctaRow}>
          <Pressable style={styles.ctaBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={DesignColors.onSurface} />
          </Pressable>
          <Pressable style={styles.publishBtn} onPress={() => {}}>
            <Text style={styles.publishText}>Publish Listing</Text>
            <View style={styles.publishIconWrap}>
              <Ionicons name="cloud-upload-outline" size={24} color="#002113" />
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e10' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  topBarLeft: { gap: 2 },
  stepLabel: { fontSize: 12, fontWeight: '600', color: DesignColors.secondary, fontFamily, letterSpacing: 0.5, textTransform: 'uppercase' },
  topBarTitle: { fontSize: 24, fontWeight: '700', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.3 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(24,24,28,0.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  stepIndicator: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24, paddingBottom: 24 },
  heroSection: { gap: 12 },
  heroUpload: {
    height: 176, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(24,24,28,0.4)', alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden',
  },
  heroImageWrap: { height: 176, borderRadius: 16, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroFilledImage: { width: '100%', height: '100%' },
  heroRemove: { position: 'absolute', top: 8, right: 8 },
  heroIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(195,192,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  heroUploadText: { fontSize: 16, fontWeight: '500', color: DesignColors.onSurface, fontFamily },
  heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: '100%', backgroundColor: 'rgba(195,192,255,0.03)' },
  heroHint: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20, paddingHorizontal: 4 },
  gallerySection: { gap: 16 },
  galleryHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  galleryTitle: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 0.5, textTransform: 'uppercase' },
  galleryLine: { height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gallerySlot: { width: '30.5%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: 'relative' },
  galleryImage: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(53,52,55,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', color: DesignColors.primary, fontFamily },
  removeOverlay: { position: 'absolute', top: 4, right: 4 },
  addSlot: { width: '30.5%', aspectRatio: 1, borderRadius: 12, backgroundColor: 'rgba(32,31,33,0.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  emptySlot: { width: '30.5%', aspectRatio: 1, borderRadius: 12, backgroundColor: 'rgba(32,31,33,0.3)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  tipCard: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(24,24,28,0.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', gap: 12 },
  tipIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(78,222,163,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipBody: { gap: 4, flex: 1 },
  tipTitle: { fontSize: 16, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  tipText: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20 },
  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  ctaBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(24,24,28,0.7)', alignItems: 'center', justifyContent: 'center' },
  publishBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#4edea3', borderRadius: 9999, paddingLeft: 24, paddingRight: 8, paddingVertical: 8, shadowColor: '#4edea3', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 6 },
  publishText: { fontSize: 16, fontWeight: '700', color: '#002113', fontFamily },
  publishIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,33,19,0.1)', alignItems: 'center', justifyContent: 'center' },
});
