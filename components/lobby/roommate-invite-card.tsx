import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

interface Props {
  inviteCode: string;
  remainingSlots: number;
  onOpenInviteModal: () => void;
}

export function RoommateInviteCard({ inviteCode, remainingSlots, onOpenInviteModal }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="person-add-outline" size={20} color={DesignColors.primaryBright} />
        <Text style={styles.title}>Invite Friends to Group</Text>
      </View>
      
      <Text style={styles.description}>
        You have <Text style={styles.highlight}>{remainingSlots} remaining slot(s)</Text>. Want to live with friends? Share your Group Code below so classmates can join directly under separate student invoices.
      </Text>

      <View style={styles.actionRow}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeLabel}>GROUP CODE</Text>
          <Text style={styles.codeValue}>{inviteCode || 'GIDA-GRP-DEV'}</Text>
        </View>

        
        <Pressable style={styles.inviteButton} onPress={onOpenInviteModal} testID="open-roommate-modal-btn">
          <Ionicons name="mail-outline" size={16} color={DesignColors.onPrimaryContainer} />
          <Text style={styles.inviteButtonText}>Invite Friend</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.primaryBright,
    gap: DesignSpacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  title: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  description: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, lineHeight: 20 },
  highlight: { color: DesignColors.primaryBright, fontWeight: '700' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  codeBadge: {
    backgroundColor: DesignColors.surfaceContainerLowest,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 6,
    borderRadius: DesignRadius.sm,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  codeLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontSize: 9 },
  codeValue: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '800', letterSpacing: 1 },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignColors.primaryContainer,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 10,
    borderRadius: DesignRadius.sm,
    gap: 6,
  },
  inviteButtonText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontWeight: '700', fontFamily },
});
