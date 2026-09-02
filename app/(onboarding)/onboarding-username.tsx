import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingGlassCard } from '@/components/onboarding/onboarding-glass-card';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';
import { OnboardingNavRow } from '@/components/onboarding/onboarding-nav-row';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useOnboarding } from '@/context/onboarding-context';
import { useAuth } from '@/context/auth-context';
import { isUsernameAvailable, loadOnboardingPrefill, normalizeUsername, validateUsernameFormat, suggestUsername } from '@/services/username-service';

type CheckState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'taken' }
  | { kind: 'invalid' };

export default function OnboardingUsernameScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data, updateData, prefillData } = useOnboarding();
  const { profile } = useAuth();

  const [raw, setRaw] = useState<string | null>(null);
  const [check, setCheck] = useState<CheckState>({ kind: 'idle' });
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefillDone = useRef(false);

  useEffect(() => {
    if (prefillDone.current || !profile?.id) return;
    prefillDone.current = true;
    void loadOnboardingPrefill(profile.id).then((patch) => {
      if (patch && Object.keys(patch).length > 0) prefillData(patch);
    });
  }, [profile?.id, prefillData]);

  useEffect(() => {
    if (raw != null || !profile) return;
    void suggestUsername(profile.full_name, profile.id).then((suggestion) => {
      setRaw(suggestion);
      updateData({ username: suggestion });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const value = raw ?? data.username;
  const normalized = normalizeUsername(value);

  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    const formatResult = validateUsernameFormat(normalized);
    if (!formatResult.valid) {
      setCheck({ kind: normalized ? 'invalid' : 'idle' });
      return;
    }
    setCheck({ kind: 'checking' });
    checkTimer.current = setTimeout(() => {
      void isUsernameAvailable(normalized).then((available) => {
        setCheck(available ? { kind: 'available' } : { kind: 'taken' });
      });
    }, 400);
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [normalized]);

  const handleChange = useCallback((text: string) => {
    setRaw(text);
    updateData({ username: normalizeUsername(text) });
  }, [updateData]);

  const canContinue = check.kind === 'available';

  const handleContinue = () => {
    if (check.kind === 'taken') {
      showToast({ type: 'error', message: 'That username is already taken. Try another.' });
      return;
    }
    if (check.kind === 'invalid') {
      showToast({ type: 'error', message: 'Use 3+ lowercase letters, numbers, dots or underscores (e.g. @gabriel.g).' });
      return;
    }
    if (!canContinue) {
      showToast({ type: 'error', message: 'Please enter a valid, available username.' });
      return;
    }
    router.push('/(onboarding)/onboarding-gender');
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress step={1} label="Pick a username" />

      <OnboardingGlassCard>
        <View style={styles.header}>
          <Text style={styles.title}>Choose your username</Text>
          <Text style={styles.subtitle}>
            This is how friends and roommates will tell you apart. It’s unique to you and can’t be shared.
          </Text>
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.atSign}>@</Text>
          <TextInput
            style={styles.input}
            placeholder="username"
            placeholderTextColor={DesignColors.outline}
            value={normalized}
            onChangeText={handleChange}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
          />
        </View>

        <View style={styles.statusRow}>
          {check.kind === 'checking' ? (
            <>
              <Ionicons name="time-outline" size={15} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.statusText}>Checking availability…</Text>
            </>
          ) : check.kind === 'available' ? (
            <>
              <Ionicons name="checkmark-circle" size={15} color={DesignColors.success} />
              <Text style={[styles.statusText, styles.availableText]}>@{normalized} is available!</Text>
            </>
          ) : check.kind === 'taken' ? (
            <>
              <Ionicons name="close-circle" size={15} color={DesignColors.error} />
              <Text style={[styles.statusText, styles.takenText]}>@{normalized} is taken. Try another.</Text>
            </>
          ) : check.kind === 'invalid' ? (
            <>
              <Ionicons name="alert-circle" size={15} color={DesignColors.error} />
              <Text style={[styles.statusText, styles.takenText]}>
                Use 3+ characters: letters, numbers, dots or underscores.
              </Text>
            </>
          ) : (
            <Text style={styles.statusText}>Only lowercase letters, numbers, dots and underscores (no spaces).</Text>
          )}
        </View>
      </OnboardingGlassCard>

      <OnboardingNavRow
        showBack={false}
        continueDisabled={!canContinue}
        onContinue={handleContinue}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: DesignSpacing.xs,
    alignItems: 'center',
  },
  title: {
    ...DesignTypography.headlineLg,
    color: DesignColors.onSurface,
    fontFamily,
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingHorizontal: DesignSpacing.md,
    marginTop: DesignSpacing.md,
  },
  atSign: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '700',
    marginRight: 6,
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    paddingVertical: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: DesignSpacing.sm + 2,
  },
  statusText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flexShrink: 1,
  },
  availableText: {
    color: DesignColors.success,
    fontWeight: '600',
  },
  takenText: {
    color: DesignColors.error,
  },
});
