import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthFooterLink } from '@/components/auth/auth-footer-link';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { resendSignupConfirmation } from '@/services/authService';

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = typeof emailParam === 'string' ? emailParam : '';
  const { showToast } = useAppToast();
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || isSending) return;
    setIsSending(true);
    try {
      await resendSignupConfirmation(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      showToast({ type: 'success', message: 'Verification email sent. Check your inbox.' });
    } catch (error) {
      console.error('[VerifyEmailScreen] Could not resend confirmation email:', error);
      showToast({ type: 'error', message: 'Could not resend the email. Please try again shortly.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Check your email"
      subtitle="One quick step before you can sign in."
      footer={<AuthFooterLink prompt="Already verified?" actionLabel="Sign in" href="/login" />}>
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Ionicons name="mail-unread-outline" size={34} color={DesignColors.primaryBright} />
        </View>
        <Text style={styles.message}>
          We&apos;ve sent a verification link to{email ? ` ${email}` : ' your email address'}. Open the message and tap the link to activate your account.
        </Text>
        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={20} color={DesignColors.primaryBright} />
          <Text style={styles.tipText}>If you don&apos;t see it, check your spam or junk folder.</Text>
        </View>
        <AuthButton
          label={cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
          variant="secondary"
          onPress={handleResend}
          disabled={!email || cooldown > 0}
          isLoading={isSending}
        />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: DesignSpacing.md },
  iconBadge: {
    width: 76,
    height: 76,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.xs,
  },
  message: {
    ...DesignTypography.bodyMd,
    color: DesignColors.textPrimary,
    fontFamily,
    lineHeight: 24,
    textAlign: 'center',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    alignSelf: 'stretch',
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.primaryTint,
    padding: DesignSpacing.md,
  },
  tipText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
});
