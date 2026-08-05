import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAppToast } from '@/components/ui/toast-card';
import type { SlotCredit } from '@/types/liquidity';

export function SlotPass({ credit }: { credit?: SlotCredit }) {
  const { showToast } = useAppToast();
  const estateName = credit?.estate?.name || 'Gida Campus Residence';
  const inviteCode = credit?.invite_code || 'GIDA-JOIN-2026';

  const handleCopyInvite = () => {
    showToast({ message: `Copied invite code: ${inviteCode}`, type: 'success' });
  };

  return (
    <View style={styles.passCard} testID="slot-pass-card">
      <View style={styles.topSection}>
        <Text style={styles.issuer}>GIDA DIGITAL MOVE-IN PASS</Text>
        <Ionicons name="qr-code" size={28} color={DesignColors.primaryBright} />
      </View>
      <Text style={styles.estateTitle}>{estateName}</Text>
      <View style={styles.metaRow}>
        <View>
          <Text style={styles.metaLabel}>TOTAL SLOTS</Text>
          <Text style={styles.metaValue}>{credit?.property_tier || 4} Slots</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>RESERVED SLOTS</Text>
          <Text style={styles.metaValue}>{credit?.intent_size || 1} Slot(s)</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>STATUS</Text>
          <Text style={styles.statusValue}>{(credit?.status || 'PAID UNMATCHED').toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.inviteSection}>
        <Text style={styles.inviteLabel}>APARTMENT GROUP INVITE CODE</Text>
        <Pressable style={styles.inviteButton} onPress={handleCopyInvite} testID="copy-invite-btn">

          <Text style={styles.inviteCode}>{inviteCode}</Text>
          <Ionicons name="copy-outline" size={18} color={DesignColors.onPrimaryContainer} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  passCard: { backgroundColor: '#1A1A1E', borderRadius: DesignRadius.xl, padding: DesignSpacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: DesignSpacing.md },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  issuer: { ...DesignTypography.labelCaps, color: DesignColors.primaryBright, fontFamily },
  estateTitle: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontWeight: '800' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant },
  metaValue: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontWeight: '700' },
  statusValue: { ...DesignTypography.bodyLg, color: DesignColors.secondary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  inviteSection: { gap: DesignSpacing.xs },
  inviteLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant },
  inviteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: DesignColors.primaryContainer, padding: DesignSpacing.sm, borderRadius: DesignRadius.md },
  inviteCode: { ...DesignTypography.bodyLg, color: DesignColors.onPrimaryContainer, fontWeight: '800', letterSpacing: 1 },
});
