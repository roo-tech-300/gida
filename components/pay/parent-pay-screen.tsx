import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePayConfirmation, usePayLink } from '@/hooks/use-pay-link';
import { startParentPayment } from '@/services/payment-link-service';
import { formatNaira } from '@/utils/format-naira';

import { PayForm } from './pay-form';
import { PayMessageState } from './pay-message-state';
import { PaySummaryCard } from './pay-summary-card';
import { PayColors } from './pay-theme';

type Props = { token: string; reference?: string };

export function ParentPayScreen({ token, reference }: Props) {
  const confirmation = usePayConfirmation(token, reference);
  const link = usePayLink(token, Boolean(reference) && confirmation.data?.verified !== false);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const summary = link.data;
  const name = summary?.studentFirstName ?? 'your child';

  const pay = async (email: string) => {
    setIsPaying(true);
    setPayError(null);
    try {
      const url = await startParentPayment(token, email);
      window.location.assign(url);
    } catch (error) {
      console.error('[ParentPay] Could not start payment:', error);
      setPayError(error instanceof Error ? error.message : 'Could not start the payment. Please try again.');
      setIsPaying(false);
    }
  };

  const renderBody = () => {
    // The student's reservation had ended by the time the payment arrived: say so before anything that looks like "expired".
    if (confirmation.data?.refunded) {
      return <PayMessageState tone="neutral" icon="arrow-undo-outline" title="Your payment is being refunded" body={`${name}'s reservation had already ended, so your payment is being returned in full. It can take a few days to reach the account it came from.`} testID="pay-refunded" />;
    }
    if (confirmation.data?.refundFailed) {
      return <PayMessageState tone="danger" icon="alert-circle-outline" title="We need to look at your payment" body={`${name}'s reservation had already ended, so this payment cannot be used. We could not return it automatically. Please contact Gida Support and we will sort it out.`} testID="pay-refund-failed" />;
    }
    if (link.isLoading) return <ActivityIndicator style={styles.loader} size="large" color={PayColors.gold} />;
    if (link.isError || !summary) {
      return <PayMessageState tone="danger" icon="cloud-offline-outline" title="We could not load this link" body="Check your connection and open the link again. If it keeps happening, ask the student to send it again." testID="pay-load-error" />;
    }
    switch (summary.status) {
      case 'paid':
        return <PayMessageState tone="success" icon="checkmark" title="Payment received. Thank you." body={`${name}'s spot is paid for. A receipt from Paystack is on its way to your email.`} testID="pay-paid" />;
      case 'expired':
        return <PayMessageState tone="neutral" icon="time-outline" title="This link has expired" body={`The hold on this spot has ended. Ask ${name} to reserve again and send you a new link.`} testID="pay-expired" />;
      case 'not_ready':
        return <PayMessageState tone="neutral" icon="hourglass-outline" title="Not ready to pay yet" body={`Gida is still reviewing ${name}'s request. Try this link again once ${name} has been approved.`} testID="pay-not-ready" />;
      case 'not_found':
        return <PayMessageState tone="danger" icon="link-outline" title="This link is not valid" body="It may have been copied incompletely. Ask the student to send it again." testID="pay-not-found" />;
      case 'open':
        return (
          <View style={styles.stack}>
            {reference ? <Text style={styles.confirming} testID="pay-confirming">Confirming your payment…</Text> : null}
            <PaySummaryCard summary={summary} />
            <PayForm amountLabel={formatNaira(summary.amount ?? 0)} isPaying={isPaying} errorMessage={payError} onPay={pay} />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <Text style={styles.brand}>gida</Text>
            {renderBody()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PayColors.page },
  flex: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 16, paddingBottom: 40 },
  column: { width: '100%', maxWidth: 480, gap: 16 },
  brand: { fontSize: 30, fontWeight: '800', color: PayColors.gold, paddingTop: 20, letterSpacing: -1 },
  stack: { gap: 20 },
  loader: { paddingVertical: 64 },
  confirming: { fontSize: 14, fontWeight: '600', color: PayColors.goldDark, textAlign: 'center' },
});
