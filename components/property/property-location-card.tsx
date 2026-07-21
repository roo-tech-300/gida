import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  latitude?: number;
  longitude?: number;
  locationFee?: number;
  isUnlocked: boolean;
  onUnlockPress: () => void;
};

export function PropertyLocationCard({
  latitude = 6.5244,
  longitude = 3.3792,
  locationFee = 500,
  isUnlocked,
  onUnlockPress,
}: Props) {
  const [copied, setCopied] = useState(false);

  const latText = `${latitude.toFixed(4)}° N`;
  const lngText = `${longitude.toFixed(4)}° E`;
  const fullCoords = `${latitude}, ${longitude}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullCoords);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Exact Location & GPS</Text>

      {!isUnlocked ? (
        <View style={styles.lockedCard}>
          <View style={styles.lockedHeader}>
            <View style={styles.lockIconBg}>
              <Ionicons name="lock-closed" size={20} color={DesignColors.primary} />
            </View>
            <View style={styles.lockedHeaderText}>
              <Text style={styles.lockedTitle}>GPS Coordinates Locked</Text>
              <Text style={styles.lockedSub}>Pay ₦{locationFee} to reveal precise pin & coordinates</Text>
            </View>
          </View>

          <Pressable style={styles.unlockBtn} onPress={onUnlockPress}>
            <Ionicons name="key-outline" size={18} color={DesignColors.onPrimary} />
            <Text style={styles.unlockBtnText}>Unlock Exact Location (₦{locationFee})</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.unlockedCard}>
          <View style={styles.unlockedHeader}>
            <Ionicons name="checkmark-circle" size={20} color={DesignColors.secondary} />
            <Text style={styles.unlockedBadgeText}>EXACT GPS UNLOCKED</Text>
          </View>

          <View style={styles.coordsRow}>
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>LATITUDE</Text>
              <Text style={styles.coordValue}>{latText}</Text>
            </View>
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>LONGITUDE</Text>
              <Text style={styles.coordValue}>{lngText}</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.actionBtn} onPress={handleCopy}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={DesignColors.onSurface} />
              <Text style={styles.actionBtnText}>{copied ? 'Copied!' : 'Copy Coords'}</Text>
            </Pressable>

            <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={handleOpenMaps}>
              <Ionicons name="navigate-outline" size={16} color={DesignColors.onPrimary} />
              <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Open Maps</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignSpacing.xl,
  },
  sectionTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    marginBottom: DesignSpacing.sm,
  },
  lockedCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: DesignSpacing.md,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  lockIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 225, 118, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedHeaderText: {
    flex: 1,
  },
  lockedTitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  lockedSub: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DesignColors.primary,
    borderRadius: DesignRadius.sm,
    paddingVertical: 12,
  },
  unlockBtnText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
  unlockedCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.secondary,
    gap: DesignSpacing.md,
  },
  unlockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlockedBadgeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.secondary,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 1,
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
  actionsRow: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: DesignRadius.sm,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surface,
  },
  actionBtnPrimary: {
    backgroundColor: DesignColors.primaryContainer,
    borderColor: DesignColors.primaryContainer,
  },
  actionBtnText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  actionBtnTextPrimary: {
    color: DesignColors.onPrimaryContainer,
  },
});
