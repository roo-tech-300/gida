import { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import type { LandlordWithCount } from '@/services/landlord-service';

type Props = {
  visible: boolean;
  landlord: LandlordWithCount | null;
  onClose: () => void;
};

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function LandlordProfileModal({ visible, landlord, onClose }: Props) {
  useEscapeKey(onClose, visible);

  const handleViewProperties = useCallback(() => {
    if (!landlord) return;
    onClose();
    router.push(`/admin/landlord-properties/${landlord.id}` as never);
  }, [landlord, onClose]);

  if (!landlord) return null;

  const payout = landlord.payout_details;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={20} color={DesignColors.onSurfaceVariant} />
          </Pressable>

          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(landlord.full_name)}</Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.name}>{landlord.full_name}</Text>
              <Text style={styles.joined}>Joined {formatDate(landlord.created_at)}</Text>
            </View>
          </View>

          <View style={styles.statChip}>
            <Ionicons name="business-outline" size={16} color={DesignColors.primaryBright} />
            <Text style={styles.statText}>{landlord.listings.count} Propert{landlord.listings.count === 1 ? 'y' : 'ies'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Contact</Text>
            <InfoRow icon="mail-outline" label="Email" value={landlord.email || 'Not provided'} />
            <InfoRow icon="call-outline" label="Phone" value={landlord.phone_number || 'Not provided'} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payout Details</Text>
            {payout && (payout.bank_name || payout.account_number || payout.account_name) ? (
              <>
                <InfoRow icon="wallet-outline" label="Bank" value={payout.bank_name || '—'} />
                <InfoRow icon="keypad-outline" label="Account Number" value={payout.account_number || '—'} />
                <InfoRow icon="person-outline" label="Account Name" value={payout.account_name || '—'} />
              </>
            ) : (
              <Text style={styles.emptyPayout}>No payout details added yet</Text>
            )}
          </View>

          <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={handleViewProperties}>
            <Ionicons name="arrow-forward" size={18} color={DesignColors.onPrimaryContainer} />
            <Text style={styles.ctaText}>View Properties</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={15} color={DesignColors.onSurfaceVariant} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: DesignColors.scrimHeavy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.borderFaint,
    zIndex: 2,
  },

  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: DesignColors.primary, fontFamily },
  identityInfo: { flex: 1, gap: 3 },
  name: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, paddingRight: 36 },
  joined: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },

  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: DesignColors.primaryTint,
  },
  statText: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, fontWeight: '700' },

  section: { gap: 10 },
  sectionLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: DesignColors.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: { flex: 1, gap: 1 },
  infoLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.8 },
  infoValue: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  emptyPayout: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.7 },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: DesignColors.primaryContainer,
    marginTop: 4,
  },
  ctaPressed: { opacity: 0.7 },
  ctaText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
});
