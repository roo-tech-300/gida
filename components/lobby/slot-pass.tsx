import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAppToast } from '@/components/ui/toast-card';
import type { SlotCredit } from '@/types/liquidity';

export function SlotPass({ credit, isSolo }: { credit?: SlotCredit; isSolo?: boolean }) {
  const { showToast } = useAppToast();
  const estateName = credit?.estate?.name || 'Gida Campus Residence';
  const inviteCode = credit?.invite_code || 'GIDA-JOIN-2026';
  const totalSlots = credit?.property_tier || 4;
  const reservedSlots = credit?.intent_size || 1;
  const fillPct = Math.min(1, reservedSlots / totalSlots);

  const handleCopyInvite = () => {
    showToast({ message: `Copied invite code: ${inviteCode}`, type: 'success' });
  };

  return (
    <View style={styles.passCard} testID="slot-pass-card">
      <View style={styles.header}>
        <Text style={styles.issuer}>GIDA DIGITAL MOVE-IN PASS</Text>
        <Ionicons name="qr-code" size={24} color={DesignColors.primaryBright} />
      </View>

      <Text style={styles.estateName} numberOfLines={1}>{estateName}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalSlots}</Text>
          <Text style={styles.statLabel}>Total{'\n'}Slots</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{reservedSlots}</Text>
          <Text style={styles.statLabel}>Reserved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalSlots - reservedSlots}</Text>
          <Text style={styles.statLabel}>Open{'\n'}Slots</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${fillPct * 100}%` }]} />
      </View>

      {!isSolo && (
        <>
          <View style={styles.divider} />
          <View style={styles.inviteSection}>
            <Text style={styles.inviteLabel}>APARTMENT GROUP INVITE CODE</Text>
            <Pressable style={styles.inviteButton} onPress={handleCopyInvite} testID="copy-invite-btn">
              <Text style={styles.inviteCode}>{inviteCode}</Text>
              <Ionicons name="copy-outline" size={16} color={DesignColors.onPrimaryContainer} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  passCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    padding: DesignSpacing.lg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: DesignSpacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issuer: { ...DesignTypography.labelCaps, color: DesignColors.primaryBright, fontFamily },
  estateName: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontWeight: '800' },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingVertical: DesignSpacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    ...DesignTypography.headlineLg,
    color: DesignColors.onSurface,
    fontWeight: '800',
  },
  statLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    lineHeight: 14,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: DesignColors.cardBorder,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: DesignColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: DesignColors.primaryBright,
  },
  divider: { height: 1, backgroundColor: DesignColors.glassBorder },
  inviteSection: { gap: DesignSpacing.xs },
  inviteLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DesignColors.primaryContainer,
    padding: DesignSpacing.sm,
    borderRadius: DesignRadius.md,
  },
  inviteCode: { ...DesignTypography.bodyLg, color: DesignColors.onPrimaryContainer, fontWeight: '800', letterSpacing: 1 },
});
