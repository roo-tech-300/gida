import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import type { GuestDetails, GuestErrors } from '@/utils/guest-details';

type Props = { busy: boolean; errors: GuestErrors; formError: string | null; emailTaken?: boolean; onSignIn?: () => void; onSubmit: (details: GuestDetails) => void; onBack: () => void };

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

/** The only things asked before paying: name, email, gender (the household lock needs it) and school. */
export function QuickDetailsForm({ busy, errors, formError, emailTaken = false, onSignIn, onSubmit, onBack }: Props) {
  const [details, setDetails] = useState<GuestDetails>({ name: '', email: '', gender: null, school: '' });
  // A field's message goes away as soon as the student edits it; a new submit brings back whatever is still wrong.
  // The edits belong to one set of errors, so they are discarded when a new set arrives (no effect needed).
  const [edit, setEdit] = useState<{ forErrors: GuestErrors; fields: ReadonlySet<keyof GuestDetails> }>({ forErrors: errors, fields: new Set() });
  const edited: ReadonlySet<keyof GuestDetails> = edit.forErrors === errors ? edit.fields : new Set();
  const set = (patch: Partial<GuestDetails>) => {
    setDetails((current) => ({ ...current, ...patch }));
    setEdit({ forErrors: errors, fields: new Set([...edited, ...(Object.keys(patch) as (keyof GuestDetails)[])]) });
  };
  const shown = (field: keyof GuestDetails): string | undefined => (edited.has(field) ? undefined : errors[field]);

  return (
    <SafeKeyboardView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={DesignColors.onSurface} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">A few details</Text>
        <Text style={styles.sub}>This is all we need to hold your seat. The rest can wait until after you pay.</Text>

        <Field label="FULL NAME" error={shown('name')}>
          <TextInput style={styles.input} value={details.name} onChangeText={(name) => set({ name })} autoCapitalize="words" autoComplete="name" textContentType="name" placeholder="Kemi Danjuma" placeholderTextColor={DesignColors.outline} />
        </Field>
        <Field label="EMAIL" error={shown('email')}>
          <TextInput style={styles.input} value={details.email} onChangeText={(email) => set({ email })} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" placeholderTextColor={DesignColors.outline} />
        </Field>
        <Field label="GENDER" error={shown('gender')}>
          <View style={styles.segments}>
            {(['FEMALE', 'MALE'] as const).map((value) => {
              const active = details.gender === value;
              return (
                <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => set({ gender: value })} style={[styles.segment, active && styles.segmentActive]}>
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{value === 'FEMALE' ? 'Female' : 'Male'}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>Households can be for women or men only, so we need this to place you.</Text>
        </Field>
        <Field label="SCHOOL" error={shown('school')}>
          <TextInput style={styles.input} value={details.school} onChangeText={(school) => set({ school })} autoCapitalize="words" placeholder="Federal University of Technology, Minna" placeholderTextColor={DesignColors.outline} />
        </Field>

        {formError ? <Text style={styles.formError} accessibilityRole="alert">{formError}</Text> : null}
        {emailTaken && onSignIn ? (
          <Pressable accessibilityRole="button" onPress={onSignIn} style={styles.signIn}>
            <Text style={styles.signInText}>Sign in</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => onSubmit(details)} disabled={busy} style={[styles.cta, busy && styles.ctaBusy]}>
          {busy ? <ActivityIndicator color={DesignColors.onPrimary} /> : <Text style={styles.ctaText}>Continue to payment</Text>}
        </Pressable>
        <Text style={styles.note}>We only message you about your booking. You can set a password after you pay.</Text>
      </ScrollView>
    </SafeKeyboardView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { gap: DesignSpacing.md, padding: DesignSpacing.marginMobile, paddingBottom: DesignSpacing.xl },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.surfaceContainerLow },
  title: { fontFamily, fontSize: 26, fontWeight: '800', color: DesignColors.onSurface },
  sub: { fontFamily, fontSize: 14, lineHeight: 20, color: DesignColors.onSurfaceVariant },
  field: { gap: 6 },
  label: { fontFamily, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: DesignColors.outline },
  input: { height: 52, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: DesignColors.borderSoft, backgroundColor: DesignColors.surfaceContainerLow, fontFamily, fontSize: 15, color: DesignColors.onSurface },
  segments: { flexDirection: 'row', gap: DesignSpacing.sm },
  segment: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DesignColors.borderSoft, backgroundColor: DesignColors.surfaceContainerLow },
  segmentActive: { borderColor: DesignColors.primaryBright, backgroundColor: DesignColors.primaryTintMid },
  segmentText: { fontFamily, fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant },
  segmentTextActive: { fontWeight: '700', color: DesignColors.primaryFixed },
  hint: { fontFamily, fontSize: 12, lineHeight: 17, color: DesignColors.outline },
  error: { fontFamily, fontSize: 12, color: DesignColors.danger },
  formError: { fontFamily, fontSize: 13, lineHeight: 18, color: DesignColors.danger },
  cta: { height: 52, borderRadius: DesignRadius.full, alignItems: 'center', justifyContent: 'center', marginTop: DesignSpacing.sm, backgroundColor: DesignColors.primary },
  ctaBusy: { opacity: 0.7 },
  ctaText: { fontFamily, fontSize: 16, fontWeight: '700', color: DesignColors.onPrimary },
  note: { fontFamily, fontSize: 12, textAlign: 'center', color: DesignColors.outline },
  signIn: { height: 46, borderRadius: DesignRadius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: DesignColors.primaryBright },
  signInText: { fontFamily, fontSize: 14, fontWeight: '700', color: DesignColors.primaryFixed },
});
