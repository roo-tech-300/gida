import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';

export function CreateListingRulesScreen() {
  const { data, setStep4 } = useCreateListingForm();
  const { step4 } = data;
  const [inputValue, setInputValue] = useState('');

  const handleChange = (val: string) => {
    if (!val.includes(',')) {
      setInputValue(val);
      return;
    }
    const parts = val.split(',');
    const newToken = parts[0].trim();
    if (newToken.length > 0) {
      setStep4({ rulesList: [...step4.rulesList, newToken] });
    }
    setInputValue(parts.slice(1).join(',').trimStart());
  };

  const handlePillPress = (pill: string) => {
    setStep4({ rulesList: step4.rulesList.filter((p) => p !== pill) });
    setInputValue(pill + ' ');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#0e0e10' }}
      >
        <View style={styles.topBar}>
          <View />
          <Text style={styles.stepIndicator}>Step 4 of 5</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Listing Rules</Text>
            <Text style={styles.heroSub}>Set occupancy limits and house rules for tenants</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>House Rules</Text>
            <View style={styles.glassInput}>
              <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. No pets allowed, Quiet hours after 10pm"
                placeholderTextColor="rgba(199,196,216,0.4)"
                value={inputValue}
                onChangeText={handleChange}
                onSubmitEditing={() => {
                  const trimmed = inputValue.trim();
                  if (trimmed.length > 0) {
                    setStep4({ rulesList: [...step4.rulesList, trimmed] });
                    setInputValue('');
                  }
                }}
                returnKeyType="done"
              />
            </View>
            <Text style={styles.fieldHint}>Type a rule and press comma or enter to add</Text>

            {step4.rulesList.length > 0 && (
              <View style={styles.pillWrap}>
                {step4.rulesList.map((pill, i) => (
                  <Pressable key={`${pill}-${i}`} style={styles.pill} onPress={() => handlePillPress(pill)}>
                    <Text style={styles.pillText}>{pill}</Text>
                    <Text style={styles.pillIcon}>✎</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Max Roommates Per Room</Text>
            <View style={[styles.glassInput, styles.roommateCard]}>
              <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <View style={styles.roommateLeft}>
                <Text style={styles.roommateTitle}>Roommates</Text>
                <Text style={styles.roommateDesc}>How many people per room?</Text>
              </View>
              <View style={[styles.stepper, step4.noLimit && styles.stepperDimmed]}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setStep4({ maxRoommates: Math.max(1, step4.maxRoommates - 1) })}
                  disabled={step4.noLimit}
                >
                  <Ionicons name="remove" size={20} color={step4.noLimit ? 'rgba(199,196,216,0.2)' : DesignColors.primary} />
                </Pressable>
                <Text style={[styles.roommateCount, step4.noLimit && styles.roommateCountDimmed]}>
                  {step4.noLimit ? '--' : String(step4.maxRoommates).padStart(2, '0')}
                </Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setStep4({ maxRoommates: step4.maxRoommates + 1 })}
                  disabled={step4.noLimit}
                >
                  <Ionicons name="add" size={20} color={step4.noLimit ? 'rgba(199,196,216,0.2)' : DesignColors.primary} />
                </Pressable>
              </View>
            </View>
            <Pressable style={styles.checkRow} onPress={() => setStep4({ noLimit: !step4.noLimit })}>
              <View style={[styles.checkbox, step4.noLimit && styles.checkboxActive]}>
                {step4.noLimit && <Ionicons name="checkmark" size={14} color={DesignColors.onPrimary} />}
              </View>
              <Text style={styles.checkLabel}>No limit — landlord doesn't mind</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.ctaRow}>
          <Pressable style={styles.ctaBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={DesignColors.onPrimaryContainer} />
          </Pressable>
          <Pressable style={styles.ctaBtn} onPress={() => router.push('/admin/create-listing-media')}>
            <Ionicons name="arrow-forward" size={24} color={DesignColors.onPrimaryContainer} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e10' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  stepIndicator: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  glassBlur: { ...StyleSheet.absoluteFillObject, borderRadius: 12 },
  textInput: {
    paddingHorizontal: 16, paddingVertical: 14,
    color: DesignColors.onSurface, fontSize: 16, fontFamily,
  },
  fieldHint: { fontSize: 11, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 4, paddingLeft: 4, opacity: 0.6 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: { backgroundColor: 'rgba(79,70,229,0.1)', borderWidth: 1, borderColor: 'rgba(79,70,229,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillText: { fontSize: 12, fontWeight: '600', color: '#818CF8', fontFamily, letterSpacing: 0.3 },
  pillIcon: { opacity: 0.4, fontSize: 10, color: '#818CF8' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24, paddingBottom: 24 },
  hero: { paddingTop: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.5 },
  heroSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 4 },
  fieldGroup: { gap: 8 },
  label: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  glassInput: {
    borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(24,24,28,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },

  roommateCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  roommateLeft: { gap: 2 },
  roommateTitle: { ...DesignTypography.labelSm, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  roommateDesc: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperDimmed: { opacity: 0.4 },
  stepperBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  roommateCount: { ...DesignTypography.headlineMd, color: DesignColors.primary, fontFamily, width: 32, textAlign: 'center' },
  roommateCountDimmed: { color: 'rgba(199,196,216,0.3)' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: DesignColors.outline, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: DesignColors.primary, borderColor: DesignColors.primary },
  checkLabel: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, flex: 1 },
  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  ctaBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer, alignItems: 'center', justifyContent: 'center',
    shadowColor: DesignColors.primaryContainer,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
});
