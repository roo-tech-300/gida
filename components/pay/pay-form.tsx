import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { isValidEmail } from '@/utils/payment-link';

import { PayColors } from './pay-theme';

type Props = { amountLabel: string; isPaying: boolean; errorMessage: string | null; onPay: (email: string) => void };

export function PayForm({ amountLabel, isPaying, errorMessage, onPay }: Props) {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const invalid = touched && !isValidEmail(email);

  const submit = () => {
    setTouched(true);
    if (isValidEmail(email)) onPay(email.trim());
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Your email, for the receipt</Text>
      <TextInput
        style={[styles.input, invalid && styles.inputInvalid]}
        value={email}
        onChangeText={setEmail}
        onBlur={() => setTouched(true)}
        onSubmitEditing={submit}
        placeholder="you@example.com"
        placeholderTextColor={PayColors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        returnKeyType="go"
        accessibilityLabel="Your email address"
        testID="pay-email-input"
      />
      {invalid ? <Text style={styles.error} testID="pay-email-error">Enter a valid email address, like name@example.com.</Text> : null}
      {errorMessage ? <Text style={styles.error} testID="pay-error">{errorMessage}</Text> : null}

      <Pressable
        style={[styles.button, isPaying && styles.buttonDisabled]}
        onPress={submit}
        disabled={isPaying}
        accessibilityRole="button"
        testID="pay-button"
      >
        {isPaying ? <ActivityIndicator color="#ffffff" /> : (
          <>
            <Ionicons name="lock-closed" size={16} color="#ffffff" />
            <Text style={styles.buttonText}>Pay {amountLabel}</Text>
          </>
        )}
      </Pressable>
      <Text style={styles.reassure}>Secure card or bank payment by Paystack. You do not need a Gida account.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: PayColors.ink },
  input: {
    height: 52, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: PayColors.border,
    backgroundColor: PayColors.card, fontSize: 16, color: PayColors.ink,
  },
  inputInvalid: { borderColor: PayColors.danger },
  error: { fontSize: 13, lineHeight: 18, color: PayColors.danger },
  button: {
    height: 56, borderRadius: 28, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: PayColors.gold,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  reassure: { fontSize: 12.5, lineHeight: 18, color: PayColors.muted, textAlign: 'center', paddingTop: 4 },
});
