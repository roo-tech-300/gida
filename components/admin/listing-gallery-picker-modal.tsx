import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { photoGallery } from '@/dummy/photo-gallery-mock';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  visible: boolean;
  selectedImages: string[];
  onClose: () => void;
  onDone: (images: string[]) => void;
  onPickHero: (uri: string) => void;
};

export function ListingGalleryPickerModal({ visible, selectedImages, onClose, onDone, onPickHero }: Props) {
  const [draftImages, setDraftImages] = useState<string[]>(selectedImages);

  useEffect(() => {
    if (visible) setDraftImages(selectedImages);
  }, [selectedImages, visible]);

  const addImage = (uri: string) => {
    setDraftImages((prev) => (prev.includes(uri) ? prev : [...prev, uri]));
  };

  const removeImage = (uri: string) => {
    setDraftImages((prev) => prev.filter((item) => item !== uri));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setDraftImages((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = temp;
      return next;
    });
  };

  const pickFromDevice = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo access to pick images from your device.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      onPickHero(uri);
      addImage(uri);
    }
  };

  const close = () => {
    onDone(draftImages);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View style={styles.sheet}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Pick Gallery Photos</Text>
            <Pressable onPress={close}>
              <Ionicons name="close" size={24} color={DesignColors.onSurface} />
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.actionBtn} onPress={pickFromDevice}>
              <Ionicons name="cloud-upload-outline" size={18} color={DesignColors.onPrimaryContainer} />
              <Text style={styles.actionText}>Pick from device</Text>
            </Pressable>
            <Pressable style={styles.actionBtnSoft} onPress={() => onDone(draftImages)}>
              <Ionicons name="checkmark-circle-outline" size={18} color={DesignColors.primary} />
              <Text style={styles.actionTextSoft}>Use selected</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Sample gallery</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleRow}>
            {photoGallery.map((photo, index) => {
              const uri = Image.resolveAssetSource(photo)?.uri ?? '';
              const active = draftImages.includes(uri);
              return (
                <Pressable key={`${uri}-${index}`} style={styles.sampleCard} onPress={() => (active ? removeImage(uri) : addImage(uri))}>
                  <Image source={photo} style={styles.sampleImage} />
                  <View style={styles.sampleTag}>
                    <Text style={styles.sampleTagText}>{active ? 'Selected' : 'Tap to add'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>Selected order</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedRow}>
            {draftImages.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.selectedCard}>
                <Image source={{ uri }} style={styles.selectedImage} />
                <View style={styles.orderPill}>
                  <Text style={styles.orderText}>#{index + 1}</Text>
                </View>
                <View style={styles.reorderRow}>
                  <Pressable style={styles.reorderBtn} onPress={() => moveImage(index, -1)}>
                    <Ionicons name="arrow-back" size={14} color={DesignColors.onSurface} />
                  </Pressable>
                  <Pressable style={styles.reorderBtn} onPress={() => moveImage(index, 1)}>
                    <Ionicons name="arrow-forward" size={14} color={DesignColors.onSurface} />
                  </Pressable>
                  <Pressable style={styles.reorderBtnDanger} onPress={() => removeImage(uri)}>
                    <Ionicons name="trash-outline" size={14} color={DesignColors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    minHeight: '72%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    padding: 20,
    backgroundColor: 'rgba(14,14,16,0.98)',
  },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, backgroundColor: DesignColors.primaryContainer },
  actionBtnSoft: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, backgroundColor: 'rgba(195,192,255,0.12)', borderWidth: 1, borderColor: 'rgba(195,192,255,0.18)' },
  actionText: { color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
  actionTextSoft: { color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  sectionLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  sampleRow: { gap: 12, paddingBottom: 16 },
  sampleCard: { width: 132, height: 132, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sampleImage: { width: '100%', height: '100%' },
  sampleTag: { position: 'absolute', left: 8, bottom: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)' },
  sampleTagText: { color: DesignColors.onSurface, fontSize: 11, fontWeight: '600', fontFamily },
  selectedRow: { gap: 12, paddingBottom: 12 },
  selectedCard: { width: 112, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(195,192,255,0.16)', backgroundColor: 'rgba(255,255,255,0.03)' },
  selectedImage: { width: '100%', height: 112 },
  orderPill: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)' },
  orderText: { color: DesignColors.primary, fontSize: 11, fontWeight: '700', fontFamily },
  reorderRow: { flexDirection: 'row', gap: 6, padding: 8, justifyContent: 'space-between' },
  reorderBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  reorderBtnDanger: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.12)' },
});
