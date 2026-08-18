import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';
import { NO_LIMIT_TIER } from '@/utils/liquidity-math';

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

  const handleRoommateInput = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    if (digits === '') {
      setStep4({ maxRoommates: 1 });
      return;
    }
    setStep4({ maxRoommates: Math.max(1, Math.min(10, parseInt(digits, 10))) });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }}
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
                placeholderTextColor={DesignColors.onSurfaceVariant}
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
            <Text style={styles.label}>Roommates / Slots</Text>
            <View style={[styles.glassInput, styles.roommateCard]}>
              <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <View style={styles.roommateLeft}>
                <Text style={styles.roommateTitle}>Max Roommates</Text>
                <Text style={styles.roommateDesc}>Each roommate pays an equal share of the rent</Text>
              </View>
              <View style={[styles.stepper, step4.noLimit && styles.stepperDimmed]}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setStep4({ maxRoommates: Math.max(1, step4.maxRoommates - 1) })}
                  disabled={step4.noLimit}
                >
                  <Ionicons name="remove" size={20} color={step4.noLimit ? DesignColors.onSurfaceVariant : DesignColors.primary} />
                </Pressable>
                <TextInput
                  style={[styles.roommateInput, step4.noLimit && styles.roommateInputDimmed]}
                  value={step4.noLimit ? '--' : String(step4.maxRoommates)}
                  onChangeText={handleRoommateInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!step4.noLimit}
                  selectTextOnFocus
                />
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setStep4({ maxRoommates: Math.min(10, step4.maxRoommates + 1) })}
                  disabled={step4.noLimit}
                >
                  <Ionicons name="add" size={20} color={step4.noLimit ? DesignColors.onSurfaceVariant : DesignColors.primary} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.fieldHint}>Max roommates = rent slots (1-10). Rent splits into this many equal shares - reserve 1, several, or all.</Text>
            <Pressable style={styles.checkRow} onPress={() => setStep4({ noLimit: !step4.noLimit })}>
              <View style={[styles.checkbox, step4.noLimit && styles.checkboxActive]}>
                {step4.noLimit && <Ionicons name="checkmark" size={14} color={DesignColors.onPrimary} />}
              </View>
              <Text style={styles.checkLabel}>No limit - treated as a {NO_LIMIT_TIER}-slot property; rented as a whole.</Text>
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
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  stepIndicator: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  glassBlur: { ...StyleSheet.absoluteFillObject, borderRadius: 12 },
  textInput: {
    paddingHorizontal: 16, paddingVertical: 14,
    color: DesignColors.onSurface, fontSize: 16, fontFamily,
  },
  fieldHint: { fontSize: 11, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 4, paddingLeft: 4, opacity: 0.6 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: { backgroundColor: DesignColors.primaryContainer, borderWidth: 1, borderColor: DesignColors.primaryContainer, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillText: { fontSize: 12, fontWeight: '600', color: DesignColors.onPrimaryContainer, fontFamily, letterSpacing: 0.3 },
  pillIcon: { opacity: 0.6, fontSize: 10, color: DesignColors.onPrimaryContainer },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24, paddingBottom: 24 },
  hero: { paddingTop: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.5 },
  heroSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 4 },
  fieldGroup: { gap: 8 },
  label: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  glassInput: {
    borderRadius: 12, overflow: 'hidden', backgroundColor: DesignColors.glassBg,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
  },

  roommateCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  roommateLeft: { flex: 1, gap: 2, paddingRight: 12 },
  roommateTitle: { ...DesignTypography.labelSm, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  roommateDesc: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, flexShrink: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperDimmed: { opacity: 0.4 },
  stepperBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: DesignColors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  roommateInput: {
    ...DesignTypography.headlineMd,
    color: DesignColors.primary,
    fontFamily,
    width: 40,
    textAlign: 'center',
    paddingVertical: 0,
  },
  roommateInputDimmed: { color: DesignColors.onSurfaceVariant },
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
