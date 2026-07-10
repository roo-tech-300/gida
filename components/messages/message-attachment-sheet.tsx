import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export type AttachmentSource = 'listings' | 'saved' | 'photos';

type AttachmentOption = {
  key: AttachmentSource;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const agentOptions: AttachmentOption[] = [
  { key: 'listings', title: 'My listings', subtitle: 'Share one of your active listings', icon: 'business-outline' },
];

const sharedOptions: AttachmentOption[] = [
  { key: 'saved', title: 'Saved listings', subtitle: 'Pick from homes you already liked', icon: 'heart-outline' },
  { key: 'photos', title: 'Photos', subtitle: 'Attach from your gallery', icon: 'image-outline' },
];

export function MessageAttachmentSheet({ visible, onClose, onSelectSource, isAgent }: { visible: boolean; onClose: () => void; onSelectSource: (source: AttachmentSource) => void; isAgent: boolean }) {
  const options = isAgent ? [...agentOptions, ...sharedOptions] : sharedOptions;
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Attach from</Text>
          <Text style={styles.subtitle}>Choose where you want to pull media or listings from.</Text>

          <View style={styles.list}>
            {options.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => onSelectSource(option.key)}
                style={styles.option}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name={option.icon} size={20} color={DesignColors.onSurface} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={DesignColors.outline} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    paddingHorizontal: DesignSpacing.md,
    paddingTop: DesignSpacing.sm,
    paddingBottom: DesignSpacing.xl,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginBottom: DesignSpacing.md,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginTop: 4,
    marginBottom: DesignSpacing.md,
  },
  list: {
    gap: DesignSpacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    padding: DesignSpacing.md,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  optionDisabled: {
    opacity: 0.55,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  optionTitleDisabled: {
    color: DesignColors.outline,
  },
  optionSubtitle: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
