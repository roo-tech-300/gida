import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useEscapeKey } from '@/components/claim/use-escape-key';
import { saveMyPhoneNumber } from '@/services/phone-number-service';

type Props = {
  visible: boolean;
  checking: boolean;
  lookupError: string | null;
  onRetry: () => void;
  onCancel: () => void;
  onSaved: () => void;
};

export function PhoneNumberGateModal({ visible, checking, lookupError, onRetry, onCancel, onSaved }: Props) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const cancel = useCallback(() => {
    if (!saving && !checking) onCancel();
  }, [onCancel, saving, checking]);
  useEscapeKey(cancel, visible);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveMyPhoneNumber(phone);
      setPhone('');
      onSaved();
    } catch (caught) {
      console.error('[PhoneNumberGate] Failed to save phone number:', caught);
      setError(caught instanceof Error ? caught.message : 'Could not save your phone number.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.backdrop} onPress={cancel}>
            <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
              <Text style={styles.title}>Add your phone number</Text>
              <Text style={styles.copy}>
                We need it before you book a lodge or join a pod. Your number is private and available only to people in your pod. A WhatsApp number is preferred so roommates can coordinate.
              </Text>
              {checking ? (
                <View style={styles.checking}>
                  <ActivityIndicator color={DesignColors.primaryBright} />
                  <Text style={styles.copy}>Checking your saved number…</Text>
                </View>
              ) : null}
              {lookupError ? <Text accessibilityRole="alert" style={styles.error}>{lookupError}</Text> : null}
              {lookupError && !checking ? (
                <Pressable onPress={onRetry} style={styles.cancel}>
                  <Text style={styles.cancelText}>Retry check</Text>
                </Pressable>
              ) : null}
              <TextInput
                editable={!checking && !saving}
                value={phone}
                onChangeText={setPhone}
                placeholder="+234 801 234 5678"
                placeholderTextColor={DesignColors.outline}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                autoCapitalize="none"
                accessibilityLabel="Phone number"
                style={styles.input}
              />
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <Pressable disabled={checking || saving || !phone.trim()} onPress={() => void handleSave()} style={[styles.button, (checking || saving || !phone.trim()) && styles.disabled]}>
                {saving ? <ActivityIndicator color={DesignColors.onPrimary} /> : <Text style={styles.buttonText}>Save and continue</Text>}
              </Pressable>
              <Pressable disabled={saving} onPress={cancel} style={styles.cancel}>
                <Text style={styles.cancelText}>Not now</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'center', padding: DesignSpacing.lg, backgroundColor: DesignColors.scrimHeavy },
  card: { gap: DesignSpacing.md, padding: DesignSpacing.lg, borderRadius: DesignRadius.xl, backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.cardBorder },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily },
  copy: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  input: { minHeight: 52, paddingHorizontal: DesignSpacing.md, borderRadius: DesignRadius.md, borderWidth: 1, borderColor: DesignColors.inputBorder, color: DesignColors.onSurface, fontSize: 16, fontFamily },
  error: { ...DesignTypography.bodyMd, color: DesignColors.error, fontFamily },
  checking: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  button: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: DesignRadius.full, backgroundColor: DesignColors.primary, paddingHorizontal: DesignSpacing.md },
  buttonText: { ...DesignTypography.labelLg, color: DesignColors.onPrimary, fontFamily },
  disabled: { opacity: 0.5 },
  cancel: { alignItems: 'center', padding: DesignSpacing.sm },
  cancelText: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily },
});
