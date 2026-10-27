import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { ListingVideoUploadState } from '@/utils/listing-video-upload-store';

type Props = {
  upload: ListingVideoUploadState;
  onCancel: () => void;
  onDismiss: () => void;
};

export function ListingVideoUploadCard({ upload, onCancel, onDismiss }: Props) {
  const failed = upload.status === 'failed';

  return (
    <View style={[styles.card, failed && styles.cardFailed]}>
      <View style={styles.header}>
        <Ionicons
          name={failed ? 'alert-circle-outline' : 'cloud-upload-outline'}
          size={20}
          color={failed ? DesignColors.danger : DesignColors.primary}
        />
        <Text style={styles.fileName} numberOfLines={1}>
          {upload.fileName}
        </Text>
        <Pressable
          onPress={failed ? onDismiss : onCancel}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={failed ? 'Dismiss upload error' : 'Cancel upload'}
        >
          <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
        </Pressable>
      </View>

      {upload.status === 'uploading' ? (
        <>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${upload.progress}%` }]} />
          </View>
          <Text style={styles.hint}>
            Uploading {upload.progress}% · keeps going if you leave this screen, but keep the app open
          </Text>
        </>
      ) : (
        <Text style={[styles.hint, styles.error]}>{upload.error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: DesignSpacing.sm,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  cardFailed: { backgroundColor: DesignColors.dangerContainer, borderColor: DesignColors.dangerContainer },
  header: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  fileName: { ...DesignTypography.bodyMd, flex: 1, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  track: { height: 6, borderRadius: 3, backgroundColor: DesignColors.surfaceContainerHighest, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: DesignColors.primaryBright },
  hint: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily },
  error: { color: DesignColors.danger },
});
