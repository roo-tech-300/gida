import { useEffect, useState } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { LocationPaymentModal } from './location-payment-modal';

type Props = {
  visible: boolean;
  propertyTitle: string;
  propertyLocation: string;
  latitude?: number;
  longitude?: number;
  locationFee?: number;
  onClose: () => void;
  onAssistedTour: () => void;
};

type Step = 'type' | 'unassisted';

export function BookTourModal({
  visible,
  propertyTitle,
  propertyLocation,
  latitude,
  longitude,
  locationFee,
  onClose,
  onAssistedTour,
}: Props) {
  const [step, setStep] = useState<Step>('type');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStep('type');
      setPaymentOpen(false);
      setIsUnlocked(false);
    }
  }, [visible]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [visible, onClose]);

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(propertyLocation || propertyTitle)}`;

  const handleGetDirections = () => {
    Linking.openURL(directionsUrl).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {step === 'type' ? (
            <View>
              <View style={styles.headerRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar" size={24} color={DesignColors.primary} />
                </View>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={DesignColors.onSurfaceVariant} />
                </Pressable>
              </View>

              <Text style={styles.title}>Book a Tour</Text>
              <Text style={styles.subtitle}>
                Choose how you&apos;d like to visit{' '}
                <Text style={styles.bold}>{propertyTitle}</Text>.
              </Text>

              <View style={styles.optionList}>
                <TourOption
                  icon="people-outline"
                  label="ASSISTED TOUR"
                  title="Guided Full Inspection"
                  description="Explore the inside of the property accompanied by a Gida Agent. Get full interior access, inspect amenities, and ask questions on the spot."
                  onPress={onAssistedTour}
                />
                <TourOption
                  icon="navigate-outline"
                  label="UNASSISTED TOUR"
                  title="Location & Exterior Check"
                  description="Visit the property on your own time. Perfect for scoping out the neighborhood and exact location (Note: Exterior view only, no interior access)."
                  onPress={() => setStep('unassisted')}
                />
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.headerRow}>
                <Pressable onPress={() => setStep('type')} style={styles.backBtn}>
                  <Ionicons name="chevron-back" size={24} color={DesignColors.onSurface} />
                </Pressable>
                <Text style={styles.headerTitle}>Location & Exterior Check</Text>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={DesignColors.onSurfaceVariant} />
                </Pressable>
              </View>

              <Text style={styles.subtitle}>
                Visit the property on your own time. Perfect for scoping out the neighborhood and
                exact location.
              </Text>

              <View style={styles.locationCard}>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={18} color={DesignColors.primary} />
                  <Text style={styles.locationText}>{propertyLocation}</Text>
                </View>
                {isUnlocked && hasCoords && (
                  <View style={styles.coordsRow}>
                    <View style={styles.coordBox}>
                      <Text style={styles.coordLabel}>LATITUDE</Text>
                      <Text style={styles.coordValue}>{latitude!.toFixed(4)}° N</Text>
                    </View>
                    <View style={styles.coordBox}>
                      <Text style={styles.coordLabel}>LONGITUDE</Text>
                      <Text style={styles.coordValue}>{longitude!.toFixed(4)}° E</Text>
                    </View>
                  </View>
                )}
                {!isUnlocked && (
                  <View style={styles.lockedRow}>
                    <Ionicons name="lock-closed" size={14} color={DesignColors.primary} />
                    <Text style={styles.lockedHint}>
                      Exact GPS coordinates & directions are locked. Pay a small verification fee to
                      unlock.
                    </Text>
                  </View>
                )}
                <Text style={styles.exteriorNote}>Exterior view only, no interior access.</Text>
              </View>

              {isUnlocked ? (
                <Pressable style={styles.directionsBtn} onPress={handleGetDirections}>
                  <Ionicons name="navigate" size={18} color={DesignColors.onPrimary} />
                  <Text style={styles.directionsBtnText}>Get Directions</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.directionsBtn} onPress={() => setPaymentOpen(true)}>
                  <Ionicons name="lock-open-outline" size={18} color={DesignColors.onPrimary} />
                  <Text style={styles.directionsBtnText}>
                    Unlock Location & Directions (₦{(locationFee ?? 500).toLocaleString('en-US')})
                  </Text>
                </Pressable>
              )}

              <Pressable onPress={() => setStep('type')} style={styles.switchLink}>
                <Text style={styles.switchLinkText}>Back to tour options</Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
      <LocationPaymentModal
        visible={paymentOpen}
        feeAmount={locationFee}
        propertyTitle={propertyTitle}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => {
          setIsUnlocked(true);
          setPaymentOpen(false);
        }}
      />
    </Modal>
  );
}

function TourOption({
  icon,
  label,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]} onPress={onPress}>
      <View style={styles.optionIconBg}>
        <Ionicons name={icon} size={22} color={DesignColors.primary} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={DesignColors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: DesignColors.scrimHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSpacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: DesignColors.surface,
    borderRadius: DesignRadius.lg,
    padding: DesignSpacing.lg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSpacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignColors.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
    marginBottom: DesignSpacing.md,
  },
  bold: {
    fontWeight: '700',
    color: DesignColors.onSurface,
  },
  optionList: {
    gap: DesignSpacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  optionCardPressed: {
    borderColor: DesignColors.primary,
  },
  optionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DesignColors.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.secondary,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 1,
  },
  optionTitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  optionDesc: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 16,
  },
  locationCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: DesignSpacing.md,
    marginBottom: DesignSpacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    flex: 1,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: DesignSpacing.md,
  },
  coordBox: {
    flex: 1,
    backgroundColor: DesignColors.surface,
    padding: DesignSpacing.sm,
    borderRadius: DesignRadius.sm,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  coordLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginBottom: 2,
  },
  coordValue: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedHint: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  exteriorNote: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontStyle: 'italic',
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DesignColors.primary,
    borderRadius: DesignRadius.md,
    paddingVertical: 14,
    marginBottom: DesignSpacing.md,
  },
  directionsBtnText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
  switchLink: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  switchLinkText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.primary,
    fontFamily,
    fontWeight: '600',
  },
});
