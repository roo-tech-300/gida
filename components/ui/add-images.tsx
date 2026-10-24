import { StyleSheet, Pressable, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';

type AddImagesProps = {
  onPress: () => void;
  hasImages: boolean;
  images?: string[];
  onRemove?: (index: number) => void;
  selectedCount?: number;
  layout?: 'inline' | 'grid';
};

export function AddImages({ onPress, hasImages, images, onRemove, selectedCount, layout = 'inline' }: AddImagesProps) {
  if (layout === 'grid') {
    return (
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {renderGridSlots(images ?? [], onRemove, selectedCount ?? 0)}
          {!hasImages || (selectedCount ?? 0) < 10 ? (
            <Pressable style={styles.gridAddSlot} onPress={onPress}>
              <Ionicons name="add" size={28} color={DesignColors.primary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <Pressable style={styles.button} onPress={onPress}>
      <View style={styles.buttonInner}>
        {hasImages ? (
          <View style={styles.imagePreview}>
            <Ionicons name="checkmark-circle" size={16} color={DesignColors.primary} />
            <Text style={styles.imagePreviewText}>{selectedCount ?? 0} images</Text>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="add" size={24} color={DesignColors.primary} />
          </View>
        )}
        <Text style={styles.label}> Add Images</Text>
      </View>
    </Pressable>
  );
}

function renderGridSlots(images: string[], onRemove?: (index: number) => void, selectedCount = 0) {
  const slots = [];

  for (let i = 0; i < selectedCount; i++) {
    slots.push(
      <View key={i} style={styles.gridSlot}>
        <Image source={{ uri: images[i] }} style={styles.gridImage} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{i + 1}</Text>
        </View>
        {onRemove && (
          <Pressable style={styles.removeOverlay} onPress={() => onRemove(i)}>
            <Ionicons name="close" size={16} color={DesignColors.onSurface} />
          </Pressable>
        )}
      </View>
    );
  }

  return <>{slots}</>;
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    backgroundColor: DesignColors.glassSoft,
    borderRadius: 20,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
  },
  placeholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: 12,
  },
  imagePreviewText: {
    fontSize: 10,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  label: {
    fontSize: 12,
    color: DesignColors.primary,
    fontFamily,
  },
  // Grid layout styles
  gridContainer: {
    padding: DesignSpacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: DesignColors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DesignColors.primary,
    fontFamily,
  },
  removeOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: DesignColors.surfaceContainerHighest,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridAddSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DesignColors.primaryContainer,
    backgroundColor: DesignColors.glassFill,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
});