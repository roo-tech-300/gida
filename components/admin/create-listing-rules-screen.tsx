import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebBlurView } from '@/components/ui/web-blur-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';

const ROOMMATE_OPTIONS = [1, 2, 3, 4];

export function CreateListingRulesScreen() {
  const { data, setStep4 } = useCreateListingForm();
  const { step4 } = data;
  const [inputValue, setInputValue] = useState('');

  const addRule = (rule: string) => {
    const trimmed = rule.trim();
    if (!trimmed) return;
    setStep4({ rulesList: [...step4.rulesList, trimmed] });
  };

  const handlePillPress = (pill: string) => {
    setStep4({ rulesList: step4.rulesList.filter((p) => p !== pill) });
    setInputValue(pill + ' ');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SafeKeyboardView
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
              <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. No pets allowed, Quiet hours after 10pm"
                placeholderTextColor={DesignColors.divider}
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={() => {
                  addRule(inputValue);
                  setInputValue('');
                }}
                returnKeyType="done"
                blurOnSubmit={false}
              />
            </View>
            <Text style={styles.fieldHint}>Type a rule and press enter to add</Text>

            {step4.rulesList.length > 0 && (
              <View style={styles.pillWrap}>
                {step4.rulesList.map((pill, i) => (
                  <Pressable
                    key={`${pill}-${i}`}
                    style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
                    onPress={() => handlePillPress(pill)}
                  >
                    <Text style={styles.pillText}>{pill}</Text>
                    <Ionicons name="close" size={13} color={DesignColors.primaryBright} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Roommates / Slots</Text>
            <View style={[styles.glassInput, styles.roommateCard]}>
              <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <View style={styles.roommateLeft}>
                <Text style={styles.roommateTitle}>Max Roommates</Text>
                <Text style={styles.roommateDesc}>Rent splits into this many equal shares</Text>
              </View>
              <View style={styles.chipRow}>
                {ROOMMATE_OPTIONS.map((n) => {
                  const active = step4.maxRoommates === n;
                  return (
                    <Pressable
                      key={n}
                      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
                      onPress={() => setStep4({ maxRoommates: n })}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Text style={styles.fieldHint}>Reserve 1, several, or all slots for roommates.</Text>
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
      </SafeKeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  stepIndicator: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 28, paddingBottom: 24 },
  hero: { paddingTop: 8, gap: 4 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.5 },
  heroSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  fieldGroup: { gap: 10 },
  label: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  glassInput: {
    borderRadius: 12, overflow: 'hidden', backgroundColor: DesignColors.glassBg,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
  },
  glassBlur: { ...StyleSheet.absoluteFill, borderRadius: 12 },
  textInput: {
    paddingHorizontal: 16, paddingVertical: 14,
    color: DesignColors.onSurface, fontSize: 16, fontFamily,
  },
  fieldHint: { fontSize: 11, color: DesignColors.onSurfaceVariant, fontFamily, paddingLeft: 4, opacity: 0.6 },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  pillPressed: { opacity: 0.6 },
  pillText: { fontSize: 12, fontWeight: '600', color: DesignColors.primaryBright, fontFamily },

  roommateCard: { borderRadius: 16, padding: 16, gap: 16 },
  roommateLeft: { gap: 2 },
  roommateTitle: { ...DesignTypography.labelSm, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  roommateDesc: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, flexShrink: 1 },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1, height: 46, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.glassBg,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
  },
  chipActive: { backgroundColor: DesignColors.primaryContainer, borderColor: DesignColors.primaryContainer },
  chipPressed: { opacity: 0.7 },
  chipText: { fontSize: 15, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily },
  chipTextActive: { color: DesignColors.onPrimaryContainer },

  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  ctaBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer, alignItems: 'center', justifyContent: 'center',
    shadowColor: DesignColors.primaryContainer,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
});
