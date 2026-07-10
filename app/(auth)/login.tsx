import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthFooterLink } from '@/components/auth/auth-footer-link';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuthForm } from '@/hooks/useAuthForm';

export default function LoginScreen() {

  const { email, setEmail, password, setPassword, loading, handleLogin } = useAuthForm();

  return (
    <AuthScreenLayout
      title="Welcome back"
      subtitle="Sign in to explore listings tailored for you."
      footer={
        <>
          <AuthFooterLink prompt="Don't have an account?" actionLabel="Create account" href="/signup" />
          <Link href="/welcome" asChild>
            <Pressable accessibilityRole="link" style={styles.backWrap}>
              <Text style={styles.back}>← Other sign-in options</Text>
            </Pressable>
          </Link>
        </>
      }>
      <View style={styles.form}>
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
          autoComplete="password"
          isPassword
          label="Password"
          placeholder="Enter your password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />

        <Pressable accessibilityRole="button" style={styles.forgotWrap}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>

        <AuthButton label="Sign in" onPress={handleLogin} isLoading={loading} />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: DesignSpacing.md,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
  },
  forgot: {
    ...DesignTypography.bodyMd,
    color: DesignColors.primaryBright,
    fontWeight: '500',
    fontFamily,
  },
  backWrap: {
    marginTop: DesignSpacing.md,
  },
  back: {
    ...DesignTypography.bodyMd,
    color: DesignColors.textSecondary,
    fontFamily,
    textAlign: 'center',
  },
});
