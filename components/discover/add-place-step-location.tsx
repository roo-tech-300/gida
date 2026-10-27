import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import type { PlaceDraft } from '@/types/place';

type Props = {
  draft: PlaceDraft;
  isLocating: boolean;
  onLockLocation: () => void;
  onClearLocation: () => void;
};

export function AddPlaceStepLocation({
  draft,
  isLocating,
  onLockLocation,
  onClearLocation,
}: Props) {
  const hasCoords = draft.latitude != null && draft.longitude != null;

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Add GPS coordinates so users can tap “Directions” to navigate here directly via Google Maps.
      </Text>

      {hasCoords ? (
        <View style={styles.lockedCard}>
          <View style={styles.lockedHeader}>
            <View style={styles.lockedIconWrap}>
              <Ionicons name="checkmark-circle" size={24} color={DesignColors.secondary} />
            </View>
            <View style={styles.lockedTextWrap}>
              <Text style={styles.lockedTitle}>Location Coordinates Locked</Text>
              <Text style={styles.lockedCoords}>
                {draft.latitude?.toFixed(5)}, {draft.longitude?.toFixed(5)}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClearLocation}
            style={styles.clearButton}
          >
            <Ionicons name="trash-outline" size={16} color={DesignColors.error} />
            <Text style={styles.clearText}>Remove Coordinates</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actionCard}>
          <Pressable
            accessibilityRole="button"
            disabled={isLocating}
            onPress={onLockLocation}
            style={[styles.gpsButton, isLocating && styles.gpsButtonDisabled]}
          >
            {isLocating ? (
              <ActivityIndicator color={DesignColors.onPrimary} size="small" />
            ) : (
              <>
                <Ionicons name="navigate" size={20} color={DesignColors.onPrimary} />
                <Text style={styles.gpsButtonText}>Use Current Location</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.hintText}>
            Make sure you are standing at or near the venue with device GPS enabled. You can skip this step if you are entering this remotely.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
    gap: DesignSpacing.md,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  lockedCard: {
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: DesignSpacing.md,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  lockedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 225, 118, 0.12)',
  },
  lockedTextWrap: {
    flex: 1,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  lockedCoords: {
    fontSize: 12,
    color: DesignColors.textSecondary,
    fontFamily,
    marginTop: 2,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.surfaceContainer,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.error,
    fontFamily,
  },
  actionCard: {
    padding: DesignSpacing.lg,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    alignItems: 'center',
    gap: DesignSpacing.md,
  },
  gpsButton: {
    width: '100%',
    height: 48,
    borderRadius: DesignRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.xs,
    backgroundColor: DesignColors.primary,
  },
  gpsButtonDisabled: {
    opacity: 0.7,
  },
  gpsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: DesignColors.onPrimary,
    fontFamily,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 16,
    color: DesignColors.textSecondary,
    fontFamily,
    textAlign: 'center',
  },
});
