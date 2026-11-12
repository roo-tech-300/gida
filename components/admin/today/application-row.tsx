import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { AdminLodgeReservation } from '@/services/admin-lodge-verification-service';
import { waitingSince, type WaitTone } from '@/utils/admin-waiting';

const TONE_COLOR: Record<WaitTone, string> = {
  ok: DesignColors.success,
  warn: DesignColors.warning,
  late: DesignColors.danger,
};

type Props = {
  application: AdminLodgeReservation;
  now: number;
  busy: boolean;
  onDetails: () => void;
  onApprove: () => void;
  onDecline: () => void;
};

function who(application: AdminLodgeReservation): string {
  const names = application.members.map((m) => m.userName).filter((n): n is string => !!n);
  if (names.length === 0) return 'A student';
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
}

/** One application: who, where, how long they have waited, and the two decisions. */
export function ApplicationRow({ application, now, busy, onDetails, onApprove, onDecline }: Props) {
  const waiting = waitingSince(application.createdAt, now);
  const color = TONE_COLOR[waiting.tone];
  const spots = application.targetOccupancy > 1 ? `${application.memberCount} of ${application.targetOccupancy} spots` : 'solo';

  return (
    <View style={[styles.card, waiting.tone === 'late' && styles.cardLate]} testID={`application-${application.podId}`}>
      <View style={styles.top}>
        <Avatar name={who(application)} size={40} />
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={1}>{who(application)}</Text>
          <Text style={styles.meta} numberOfLines={1}>{application.listingTitle} · {spots}</Text>
        </View>
        <View style={styles.wait}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.waitText, { color }]}>{waiting.label}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.details} onPress={onDetails} accessibilityRole="button" disabled={busy}>
          <Text style={styles.detailsText}>Details</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.decline]} onPress={onDecline} accessibilityRole="button" disabled={busy} testID={`decline-${application.podId}`}>
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.approve]} onPress={onApprove} accessibilityRole="button" disabled={busy} testID={`approve-${application.podId}`}>
          {busy ? <ActivityIndicator size="small" color={DesignColors.onPrimary} /> : <Text style={styles.approveText}>Approve</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: DesignSpacing.md, padding: DesignSpacing.md, borderRadius: DesignRadius.xl,
    backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  cardLate: { borderColor: DesignColors.dangerContainer },
  top: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md },
  copy: { flex: 1, gap: 2 },
  name: { ...DesignTypography.labelLg, fontSize: 15, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  meta: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  wait: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  waitText: { ...DesignTypography.labelSm, fontFamily, fontWeight: '800' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  details: { height: 38, paddingHorizontal: DesignSpacing.md, justifyContent: 'center' },
  detailsText: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily, fontWeight: '600' },
  button: { flex: 1, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  decline: { backgroundColor: DesignColors.surfaceContainerHigh, borderWidth: 1, borderColor: DesignColors.borderMedium },
  declineText: { ...DesignTypography.labelLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  approve: { backgroundColor: DesignColors.primary },
  approveText: { ...DesignTypography.labelLg, color: DesignColors.onPrimary, fontFamily, fontWeight: '800' },
});
