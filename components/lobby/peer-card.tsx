import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { PodMember } from '@/types/liquidity';

interface PeerCardProps {
  peer: PodMember;
  onInvite: (userId: string) => void;
}

export function PeerCard({ peer, onInvite }: PeerCardProps) {
  return (
    <View style={styles.card} testID={`peer-card-${peer.user_id}`}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{peer.full_name}</Text>
          <Text style={styles.academic}>{peer.major} • {peer.campus}</Text>
        </View>
        <View style={styles.intentBadge}>
          <Text style={styles.intentText}>{peer.intent_size} Slot(s)</Text>
        </View>
      </View>
      <View style={styles.badgesRow}>
        <View style={styles.badge}>
          <Ionicons name="sparkles-outline" size={14} color={DesignColors.primaryBright} />
          <Text style={styles.badgeText}>Cleanliness: {peer.cleanliness_score}/5</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="moon-outline" size={14} color={DesignColors.tertiary} />
          <Text style={styles.badgeText}>{peer.sleep_schedule}</Text>
        </View>
      </View>
      <Pressable style={styles.inviteBtn} onPress={() => onInvite(peer.user_id)} testID={`invite-btn-${peer.user_id}`}>
        <Ionicons name="add-circle-outline" size={18} color={DesignColors.onPrimary} />
        <Text style={styles.inviteText}>Invite to Pod</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.lg, padding: DesignSpacing.md, borderWidth: 1, borderColor: DesignColors.cardBorder, gap: DesignSpacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  academic: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, marginTop: 2 },
  intentBadge: { backgroundColor: DesignColors.primaryContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  intentText: { ...DesignTypography.labelSm, color: DesignColors.onPrimaryContainer, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: DesignColors.surfaceContainerLowest, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  badgeText: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary, paddingVertical: 10, borderRadius: DesignRadius.md, gap: 6, marginTop: 4 },
  inviteText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimary, fontWeight: '700' },
});
