import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { LandlordSearch } from '@/components/admin/landlord-search';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';

const layoutOptions: { key: 'self_contain' | 'single_room' | 'flat'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'self_contain', label: 'Self-Contain', icon: 'bed-outline' },
  { key: 'single_room', label: 'Single Room', icon: 'albums-outline' },
  { key: 'flat', label: 'Flat', icon: 'business-outline' },
];

function formatPrice(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

export function CreateListingCoreSpecsScreen() {
  const { data, setStep1 } = useCreateListingForm();
  const { step1 } = data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#0e0e10' }}
      >
        <View style={styles.topBar}>
          <BackButton hasBackground={false} />
          <Text style={styles.stepIndicator}>Step 1 of 5</Text>
        </View>

        <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Listing Specifications</Text>
          <Text style={styles.heroSub}>Details about your property listing</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Listing Title Name</Text>
          <View style={[styles.glassInput, styles.inputRounded]}>
            <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Royal Heights Apartments"
              placeholderTextColor="rgba(199,196,216,0.4)"
              value={step1.title}
              onChangeText={(v) => setStep1({ title: v })}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description</Text>
          <View style={[styles.glassInput, styles.inputRounded]}>
            <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
            <TextInput
              style={[styles.textInput, { minHeight: 100, textAlignVertical: 'top' }]}
              placeholder="Describe the proximity to campus, water availability, and security features..."
              placeholderTextColor="rgba(199,196,216,0.4)"
              value={step1.description}
              onChangeText={(v) => setStep1({ description: v })}
              multiline
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Select Landlord</Text>
          <LandlordSearch selectedId={step1.landlordId} onSelect={(v) => setStep1({ landlordId: v })} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Layout Type</Text>
          <View style={styles.layoutRow}>
            {layoutOptions.map((opt) => {
              const active = step1.layoutType === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.layoutCard, active && styles.layoutCardActive]}
                  onPress={() => setStep1({ layoutType: opt.key })}
                >
                  <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
                  <Ionicons name={opt.icon} size={24} color={active ? DesignColors.primary : DesignColors.onSurfaceVariant} />
                  <Text style={[styles.layoutLabel, active && styles.layoutLabelActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Pricing & Terms</Text>
          <View style={styles.pricingRow}>
            <View style={[styles.glassInput, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
              <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <Text style={styles.currencySign}>₦</Text>
              <TextInput
                style={styles.textInput}
                placeholder="250,000"
                placeholderTextColor="rgba(199,196,216,0.4)"
                value={step1.price}
                onChangeText={(text) => setStep1({ price: formatPrice(text) })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.termPill}>
              <Pressable
                style={[styles.termOption, step1.term === 'per_semester' && styles.termActive]}
                onPress={() => setStep1({ term: 'per_semester' })}
              >
                <Text style={[styles.termText, step1.term === 'per_semester' && styles.termTextActive]}>Per Semester</Text>
              </Pressable>
              <Pressable
                style={[styles.termOption, step1.term === 'per_annum' && styles.termActive]}
                onPress={() => setStep1({ term: 'per_annum' })}
              >
                <Text style={[styles.termText, step1.term === 'per_annum' && styles.termTextActive]}>Per Annum</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={[styles.glassInput, styles.unitCard, styles.inputRounded]}>
            <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
            <View style={styles.unitLeft}>
              <Text style={styles.label}>Units Available</Text>
              <Text style={styles.unitDesc}>How many rooms are left?</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setStep1({ units: Math.max(0, step1.units - 1) })}
              >
                <Ionicons name="remove" size={20} color={DesignColors.primary} />
              </Pressable>
              <Text style={styles.unitCount}>{String(step1.units).padStart(2, '0')}</Text>
              <Pressable style={styles.stepperBtn} onPress={() => setStep1({ units: step1.units + 1 })}>
                <Ionicons name="add" size={20} color={DesignColors.primary} />
              </Pressable>
            </View>
          </View>
        </View>

      </ScrollView>

      <View style={styles.ctaRow}>
        <Pressable style={styles.ctaBtn} onPress={() => router.push('/admin/create-listing-location')}>
          <Ionicons name="arrow-forward" size={24} color={DesignColors.onPrimaryContainer} />
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e10' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  stepIndicator: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
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
  inputRounded: { borderRadius: 20 },
  glassBlur: { ...StyleSheet.absoluteFillObject },
  textInput: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 14,
    color: DesignColors.onSurface, fontSize: 16, fontFamily,
  },
  layoutRow: { flexDirection: 'row', gap: 12 },
  layoutCard: {
    flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(24,24,28,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 16, alignItems: 'center', gap: 8,
  },
  layoutCardActive: {
    borderColor: DesignColors.primary,
    backgroundColor: 'rgba(79,70,229,0.1)',
  },
  layoutLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  layoutLabelActive: { color: DesignColors.onSurface },
  pricingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currencySign: { fontSize: 20, fontWeight: '700', color: DesignColors.primary, fontFamily, paddingLeft: 16 },
  termPill: {
    flexDirection: 'row', borderRadius: 9999, overflow: 'hidden',
    backgroundColor: 'rgba(24,24,28,0.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 4,
  },
  termOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 },
  termActive: { backgroundColor: DesignColors.primaryContainer },
  termText: { ...DesignTypography.labelSm, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
  termTextActive: { color: DesignColors.onSurface },
  unitCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  unitLeft: { gap: 2 },
  unitDesc: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  unitCount: { ...DesignTypography.headlineMd, color: DesignColors.primary, fontFamily, width: 32, textAlign: 'center' },
  ctaRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  ctaBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer, alignItems: 'center', justifyContent: 'center',
    shadowColor: DesignColors.primaryContainer,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
});
