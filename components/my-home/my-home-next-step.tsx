import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AuthButton } from '@/components/auth/auth-button';
import { useSharePaymentLink } from '@/hooks/use-share-payment-link';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { nextStepCopy, type NextStepCopy } from '@/utils/reservation-copy';
import { formatHoldDeadline, type ReservationStage } from '@/utils/reservation-state';
import type { SlotCredit } from '@/types/liquidity';

const BORDER: Record<NextStepCopy['tone'], string> = {
  action: DesignColors.primaryTintBorder,
  waiting: DesignColors.borderMedium,
  done: DesignColors.successContainer,
  problem: DesignColors.dangerContainer,
};

type Props = { credit: SlotCredit; stage: ReservationStage };

export function MyHomeNextStep({ credit, stage }: Props) {
  const router = useRouter();
  const copy = nextStepCopy(credit, stage);
  const { share, isSharing } = useSharePaymentLink();

  return (
    <View style={[styles.card, { borderColor: BORDER[copy.tone] }]} testID="my-home-next-step">
      <Text style={styles.eyebrow}>{copy.tone === 'done' ? 'ALL GOOD' : 'NEXT STEP'}</Text>
      <Text style={styles.title}>{copy.title}</Text>
      {copy.showHold ? (
        <View style={styles.hold}>
          <Ionicons name="time-outline" size={16} color={DesignColors.warning} />
          <Text style={styles.holdText}>Held until {formatHoldDeadline(credit.payment_deadline)}</Text>
        </View>
      ) : (
        <Text style={styles.body}>{copy.body}</Text>
      )}
      <AuthButton label={copy.ctaLabel} variant={copy.tone === 'problem' ? 'secondary' : 'primary'} onPress={() => router.push(copy.href)} />
      {stage === 'awaiting_payment' ? (
        <AuthButton
          label="Send to a parent"
          variant="secondary"
          isLoading={isSharing}
          onPress={() => share({ creditId: credit.id, amount: credit.amount_paid ?? 0, placeTitle: credit.estate?.name })}
          testID="my-home-send-to-parent"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: DesignSpacing.sm, padding: DesignSpacing.lg, borderRadius: DesignRadius.xl, borderWidth: 1,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  eyebrow: { ...DesignTypography.labelCaps, color: DesignColors.primaryBright, fontFamily },
  title: { ...DesignTypography.headlineMd, fontSize: 20, lineHeight: 26, color: DesignColors.onSurface, fontFamily, fontWeight: '800' },
  body: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 21, paddingBottom: DesignSpacing.xs },
  hold: {
    flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md,
    paddingVertical: 10, borderRadius: DesignRadius.md, backgroundColor: DesignColors.warningContainer, marginBottom: DesignSpacing.xs,
  },
  holdText: { ...DesignTypography.labelLg, color: DesignColors.warning, fontFamily, fontWeight: '600' },
});
