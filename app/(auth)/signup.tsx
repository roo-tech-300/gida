import { StyleSheet, Text, View } from 'react-native';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthFooterLink } from '@/components/auth/auth-footer-link';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useState } from 'react';
import { useAppToast } from '@/components/ui/toast-card';

export default function SignupScreen() {
  const { showToast } = useAppToast();
  const {
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    loading, handleRegister
  } = useAuthForm();

  const [confirmPassword, setConfirmPassword] = useState('');

  const handleCreateAccount = () => {
    if (password !== confirmPassword) {
      showToast({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    handleRegister();
  };

  return (
    <AuthScreenLayout
      title="Create your account"
      subtitle="Join Gida for curated lodge listings at your fingertips."
      footer={
        <AuthFooterLink prompt="Already have an account?" actionLabel="Sign in" href="/login" />
      }>
      <View style={styles.form}>
        <AuthInput
          autoCapitalize="words"
          autoComplete="name"
          label="Full name"
          placeholder="Random FUT Minna Student"
          textContentType="name"
          value={fullName}
          onChangeText={setFullName}
        />
        <AuthInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          placeholder="randomfutminna@godluzia.com"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />
        <AuthInput
          autoCapitalize="none"
          autoComplete="new-password"
          isPassword
          label="Password"
          placeholder="At least 8 characters"
          textContentType="newPassword"
          value={password}
          onChangeText={setPassword}
        />
        <AuthInput
          autoCapitalize="none"
          autoComplete="new-password"
          isPassword
          label="Confirm password"
          placeholder="Re-enter your password"
          textContentType="newPassword"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Text style={styles.terms}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </Text>

        <AuthButton label="Create account" onPress={handleCreateAccount} isLoading={loading} />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: DesignSpacing.md },
  terms: {
    ...DesignTypography.labelSm,
    color: DesignColors.textSecondary,
    fontFamily,
    textAlign: 'center',
    lineHeight: 18,
  },
});