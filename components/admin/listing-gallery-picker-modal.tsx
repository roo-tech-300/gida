import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { CustomAlert, useCustomAlert } from '@/components/ui/custom-alert';

type Props = {
  visible: boolean;
  selectedImages: string[];
  onClose: () => void;
  onDone: (images: string[]) => void;
};

export function ListingGalleryPickerModal({ visible, selectedImages, onClose, onDone }: Props) {
  const [draftImages, setDraftImages] = useState<string[]>(selectedImages);
  const [loading, setLoading] = useState(false);
  const permissionAlert = useCustomAlert();

  useEffect(() => {
    if (visible) setDraftImages(selectedImages);
  }, [selectedImages, visible]);

  const addImages = (uris: string[]) => {
    setDraftImages((prev) => {
      const existing = new Set(prev);
      const newOnes = uris.filter((u) => !existing.has(u));
      return [...prev, ...newOnes];
    });
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
    setLoading(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        permissionAlert.showAlert({
          title: 'Permission required',
          message: 'Please allow photo access to pick images from your device.',
          buttons: [{ label: 'OK', style: 'primary' }],
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (!result.canceled) {
        addImages(result.assets.map((a) => a.uri));
      }
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Gallery Photos</Text>
            <Pressable onPress={close}>
              <Ionicons name="close" size={24} color={DesignColors.onSurface} />
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.actionBtn} onPress={pickFromDevice} disabled={loading}>
              <Ionicons name="cloud-upload-outline" size={18} color={DesignColors.onPrimaryContainer} />
              <Text style={styles.actionText}>Pick from device</Text>
            </Pressable>
            <Pressable style={styles.actionBtnSoft} onPress={() => onDone(draftImages)}>
              <Ionicons name="checkmark-circle-outline" size={18} color={DesignColors.primary} />
              <Text style={styles.actionTextSoft}>Use selected</Text>
            </Pressable>
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={DesignColors.primary} />
              <Text style={styles.loadingText}>Loading photos...</Text>
            </View>
          )}

          {!loading && draftImages.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Reorder & manage ({draftImages.length} selected)</Text>
              <View style={styles.grid}>
                {draftImages.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.gridCard}>
                    <Image source={{ uri }} style={styles.gridImage} />
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderBadgeText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.gridActions}>
                      <Pressable style={styles.gridBtn} onPress={() => moveImage(index, -1)}>
                        <Ionicons name="chevron-back" size={12} color={DesignColors.onSurface} />
                      </Pressable>
                      <Pressable style={styles.gridBtn} onPress={() => moveImage(index, 1)}>
                        <Ionicons name="chevron-forward" size={12} color={DesignColors.onSurface} />
                      </Pressable>
                      <Pressable style={styles.gridBtnDanger} onPress={() => removeImage(uri)}>
                        <Ionicons name="trash-outline" size={12} color={DesignColors.error} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {!loading && draftImages.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={48} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.emptyText}>No photos selected yet</Text>
              <Text style={styles.emptySub}>Tap "Pick from device" to add images</Text>
            </View>
          )}
        </View>
      </View>
      <CustomAlert visible={permissionAlert.visible} title={permissionAlert.title} message={permissionAlert.message} buttons={permissionAlert.buttons} onDismiss={permissionAlert.hideAlert} />
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
  actionBtnSoft: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, backgroundColor: 'rgba(94,124,94,0.12)', borderWidth: 1, borderColor: 'rgba(94,124,94,0.18)' },
  actionText: { color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
  actionTextSoft: { color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  sectionLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  loadingText: { fontSize: 14, color: DesignColors.onSurfaceVariant, fontFamily },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 },
  gridCard: {
    width: '31%', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(94,124,94,0.16)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gridImage: { width: '100%', height: 96 },
  orderBadge: {
    position: 'absolute', top: 6, left: 6,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  orderBadgeText: { color: DesignColors.primary, fontSize: 10, fontWeight: '700', fontFamily },
  gridActions: {
    flexDirection: 'row', gap: 4, padding: 6, justifyContent: 'center',
  },
  gridBtn: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gridBtnDanger: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
  emptySub: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.6, textAlign: 'center' },
});
