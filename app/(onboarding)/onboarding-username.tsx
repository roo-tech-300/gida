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

  const handleMatricChange = useCallback((text: string) => {
    updateData({ matricNumber: text });
  }, [updateData]);

  const [focused, setFocused] = useState<'username' | 'matric' | null>(null);

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
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>
            Choose a unique username so friends and roommates can find you.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>USERNAME</Text>
          <View style={[styles.inputWrap, focused === 'username' && styles.inputFocused]}>
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
              onFocus={() => setFocused('username')}
              onBlur={() => setFocused(null)}
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
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.optionalPill}>OPTIONAL</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>MATRIC NUMBER</Text>
          <View style={[styles.inputWrap, focused === 'matric' && styles.inputFocused]}>
            <Ionicons name="school-outline" size={20} color={DesignColors.onSurfaceVariant} style={styles.matricIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. FUTM/2023/12345"
              placeholderTextColor={DesignColors.outline}
              value={data.matricNumber}
              onChangeText={handleMatricChange}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              onFocus={() => setFocused('matric')}
              onBlur={() => setFocused(null)}
            />
          </View>
          <Text style={styles.helperText}>
            Helps verify your student status. You can skip this and continue.
          </Text>
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
    gap: DesignSpacing.sm,
    alignItems: 'center',
    marginBottom: DesignSpacing.sm,
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
    lineHeight: 22,
    paddingHorizontal: DesignSpacing.sm,
  },
  fieldGroup: {
    gap: DesignSpacing.sm,
  },
  fieldLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    letterSpacing: 1.4,
    opacity: 0.85,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingHorizontal: DesignSpacing.md,
  },
  inputFocused: {
    borderColor: DesignColors.primary,
    backgroundColor: DesignColors.surfaceContainerHighest,
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
    marginTop: DesignSpacing.xs,
    minHeight: 18,
  },
  statusText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flexShrink: 1,
  },
  helperText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    opacity: 0.85,
    lineHeight: 18,
  },
  availableText: {
    color: DesignColors.success,
    fontWeight: '600',
  },
  takenText: {
    color: DesignColors.error,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    marginVertical: DesignSpacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DesignColors.cardBorder,
  },
  optionalPill: {
    ...DesignTypography.labelCaps,
    fontSize: 10,
    color: DesignColors.primaryBright,
    fontFamily,
    letterSpacing: 1.6,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    borderRadius: DesignRadius.full,
    paddingHorizontal: DesignSpacing.sm,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  matricIcon: {
    marginRight: DesignSpacing.sm,
  },
});
