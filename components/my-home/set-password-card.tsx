import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { useNeedsPassword } from '@/hooks/use-needs-password';
import { setAccountPassword } from '@/services/guest-account-service';
import { validateNewPassword } from '@/utils/guest-details';

/** Asks a friend who joined by link to choose a password, so they can sign back in. Gone once they have. */
export function SetPasswordCard() {
  const needsPassword = useNeedsPassword();
  const { showToast } = useAppToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!needsPassword) return null;

  const submit = async () => {
    const problem = validateNewPassword(password, confirm);
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      await setAccountPassword(password);
      showToast({ message: 'Password saved. You can now sign in with your email.', type: 'success' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card} testID="set-password-card">
      <Text style={styles.eyebrow}>ONE LAST THING</Text>
      <Text style={styles.title}>Choose a password</Text>
      <Text style={styles.body}>Your account was made from your email. A password lets you sign back in on any phone.</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="New password" placeholderTextColor={DesignColors.outline} />
      <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="Type it again" placeholderTextColor={DesignColors.outline} />
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={submit} disabled={busy} style={[styles.button, busy && styles.busy]}>
        {busy ? <ActivityIndicator color={DesignColors.onPrimary} /> : <Text style={styles.buttonText}>Save password</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: DesignSpacing.sm, padding: DesignSpacing.lg, borderRadius: DesignRadius.xl, borderWidth: 1, borderColor: DesignColors.primaryTintBorder, backgroundColor: DesignColors.surfaceContainerLow },
  eyebrow: { fontFamily, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: DesignColors.primaryBright },
  title: { fontFamily, fontSize: 20, fontWeight: '800', color: DesignColors.onSurface },
  body: { fontFamily, fontSize: 13, lineHeight: 19, color: DesignColors.onSurfaceVariant },
  input: { height: 48, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: DesignColors.borderSoft, backgroundColor: DesignColors.surface, fontFamily, fontSize: 15, color: DesignColors.onSurface },
  error: { fontFamily, fontSize: 12, color: DesignColors.danger },
  button: { height: 48, borderRadius: DesignRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary },
  busy: { opacity: 0.7 },
  buttonText: { fontFamily, fontSize: 15, fontWeight: '700', color: DesignColors.onPrimary },
});
