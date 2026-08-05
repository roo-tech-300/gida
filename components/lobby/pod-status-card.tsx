import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { Pod } from '@/types/liquidity';

interface PodStatusCardProps {
  pod?: Pod;
  targetTier: number;
  physicalDoor?: string | null;
  countdownTimer?: string;
}

export function PodStatusCard({ pod, targetTier, physicalDoor, countdownTimer }: PodStatusCardProps) {
  const filled = pod?.current_total_intent ?? 1;
  const isComplete = filled >= targetTier || !!physicalDoor;
  const percentage = Math.min(Math.round((filled / targetTier) * 100), 100);

  return (
    <View style={[styles.container, isComplete ? styles.completeContainer : styles.formingContainer]}>
      <View style={styles.headerRow}>
        <Ionicons name={isComplete ? 'shield-checkmark' : 'time-outline'} size={24} color={isComplete ? DesignColors.secondary : DesignColors.tertiary} />
        <Text style={styles.statusText}>{isComplete ? 'ROOM MINTED & CONFIRMED' : 'POD IN FORMATION'}</Text>
      </View>
      <Text style={styles.mainTitle}>
        {isComplete ? (physicalDoor || 'Assigned Room: Pending confirmation') : `${filled} of ${targetTier} Slots Secured (${percentage}%)`}
      </Text>
      {!isComplete && countdownTimer && (
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>⏱️ Unmatched hold expires in: {countdownTimer}</Text>
        </View>
      )}
      <Text style={styles.desc}>
        {isComplete
          ? 'Your roommate group reached 100% capacity. An empty physical room has been assigned from the estate pool.'
          : 'Invite compatible peers from the matching lobby below to finalize your pod and mint a room.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: DesignSpacing.md, borderRadius: DesignRadius.lg, borderWidth: 1, gap: DesignSpacing.sm },
  formingContainer: { backgroundColor: DesignColors.surfaceContainerHigh, borderColor: DesignColors.tertiary },
  completeContainer: { backgroundColor: 'rgba(74, 225, 118, 0.12)', borderColor: DesignColors.secondary },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  statusText: { ...DesignTypography.labelCaps, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  mainTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontWeight: '800', fontFamily },
  timerBox: { backgroundColor: DesignColors.surfaceContainerLowest, padding: 8, borderRadius: DesignRadius.sm },
  timerText: { ...DesignTypography.bodyMd, color: DesignColors.tertiary, fontWeight: '700' },
  desc: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, lineHeight: 20 },
});
