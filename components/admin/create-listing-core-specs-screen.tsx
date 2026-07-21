import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { LandlordSearch } from '@/components/admin/landlord-search';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';
import { useAppToast } from '@/components/ui/toast-card';

const layoutOptions: { key: 'self_contain' | 'single_room' | 'flat'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'single_room', label: 'Single Room', icon: 'albums-outline' },
  { key: 'self_contain', label: 'Self-Contain', icon: 'bed-outline' },
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
  const { showToast } = useAppToast();

  const canProceed = step1.title.trim() && step1.landlordId && step1.layoutType && step1.price;
  const handleForward = () => {
    if (!step1.title.trim()) { showToast({ message: 'Listing title is required.', type: 'error' }); return; }
    if (!step1.landlordId) { showToast({ message: 'Please select a landlord.', type: 'error' }); return; }
    if (!step1.layoutType) { showToast({ message: 'Please select a layout type.', type: 'error' }); return; }
    if (!step1.price) { showToast({ message: 'Please set a price.', type: 'error' }); return; }
    router.push('/admin/create-listing-location');
  };

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
              placeholderTextColor="DesignColors.onSurfaceVariant"
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
              placeholderTextColor="DesignColors.onSurfaceVariant"
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
                  onPress={() => {
                    const updates: any = { layoutType: opt.key };
                    if (opt.key === 'single_room') { updates.bedrooms = 0; updates.bathrooms = 0; }
                    else if (opt.key === 'self_contain') { updates.bedrooms = 0; updates.bathrooms = 1; }
                    setStep1(updates);
                  }}
                >
                  <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
                  <Ionicons name={opt.icon} size={24} color={active ? DesignColors.primary : DesignColors.onSurfaceVariant} />
                  <Text style={[styles.layoutLabel, active && styles.layoutLabelActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {step1.layoutType === 'flat' && (
          <View style={styles.roomRow}>
            <View style={[styles.roomCard, { flex: 1 }]}>
              <BlurView intensity={25} tint="dark" style={styles.roomCardBlur} />
              <Text style={styles.roomLabel}>Bedrooms</Text>
              <View style={styles.roomStepper}>
                <Pressable
                  style={styles.roomBtn}
                  onPress={() => setStep1({ bedrooms: Math.max(1, step1.bedrooms - 1) })}
                >
                  <Ionicons name="remove" size={18} color={DesignColors.primary} />
                </Pressable>
                <Text style={styles.roomCount}>{String(step1.bedrooms).padStart(2, '0')}</Text>
                <Pressable
                  style={styles.roomBtn}
                  onPress={() => setStep1({ bedrooms: step1.bedrooms + 1 })}
                >
                  <Ionicons name="add" size={18} color={DesignColors.primary} />
                </Pressable>
              </View>
            </View>
            <View style={[styles.roomCard, { flex: 1 }]}>
              <BlurView intensity={25} tint="dark" style={styles.roomCardBlur} />
              <Text style={styles.roomLabel}>Bathrooms</Text>
              <View style={styles.roomStepper}>
                <Pressable
                  style={styles.roomBtn}
                  onPress={() => setStep1({ bathrooms: Math.max(1, step1.bathrooms - 1) })}
                >
                  <Ionicons name="remove" size={18} color={DesignColors.primary} />
                </Pressable>
                <Text style={styles.roomCount}>{String(step1.bathrooms).padStart(2, '0')}</Text>
                <Pressable
                  style={styles.roomBtn}
                  onPress={() => setStep1({ bathrooms: step1.bathrooms + 1 })}
                >
                  <Ionicons name="add" size={18} color={DesignColors.primary} />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Pricing & Terms</Text>
          <View style={styles.pricingRow}>
            <View style={[styles.glassInput, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
              <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <Text style={styles.currencySign}>₦</Text>
              <TextInput
                style={styles.textInput}
                placeholder="250,000"
                placeholderTextColor="DesignColors.onSurfaceVariant"
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
          <Text style={styles.label}>Size</Text>
          <View style={styles.sizeRow}>
            <View style={styles.sizePills}>
              <Pressable
                style={[styles.sizePill, step1.sizeUnit === 'sqft' && styles.sizePillActive]}
                onPress={() => setStep1({ sizeUnit: 'sqft' })}
              >
                <Text style={[styles.sizePillText, step1.sizeUnit === 'sqft' && styles.sizePillTextActive]}>sq ft</Text>
              </Pressable>
              <Pressable
                style={[styles.sizePill, step1.sizeUnit === 'sqm' && styles.sizePillActive]}
                onPress={() => setStep1({ sizeUnit: 'sqm' })}
              >
                <Text style={[styles.sizePillText, step1.sizeUnit === 'sqm' && styles.sizePillTextActive]}>m²</Text>
              </Pressable>
            </View>
            <View style={[styles.glassInput, { flex: 1 }]}>
              <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <TextInput
                style={styles.textInput}
                placeholder={step1.sizeUnit === 'sqft' ? 'e.g. 1,200' : 'e.g. 112'}
                placeholderTextColor="DesignColors.onSurfaceVariant"
                value={step1.sizeValue}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, '');
                  if (!digits) { setStep1({ sizeValue: '' }); return; }
                  setStep1({ sizeValue: Number(digits).toLocaleString('en-US') });
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
          <Text style={styles.fieldHint}>
            {step1.sizeUnit === 'sqm'
              ? 'Will be converted and stored as sq ft'
              : 'Stored as square feet'}
          </Text>
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

        <View style={styles.fieldGroup}>
          <Pressable style={styles.checkRow} onPress={() => setStep1({ isStoreyBuilding: !step1.isStoreyBuilding })}>
            <View style={[styles.checkbox, step1.isStoreyBuilding && styles.checkboxActive]}>
              {step1.isStoreyBuilding && <Ionicons name="checkmark" size={14} color={DesignColors.onPrimary} />}
            </View>
            <Text style={styles.checkLabel}>Is this a storey building?</Text>
          </Pressable>
          {step1.isStoreyBuilding && (
            <View style={[styles.glassInput, styles.unitCard, { padding: 16 }]}>
              <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <Text style={styles.roomLabel}>Total Floors</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setStep1({ totalFloors: Math.max(2, step1.totalFloors - 1) })}
                >
                  <Ionicons name="remove" size={20} color={DesignColors.primary} />
                </Pressable>
                <Text style={styles.unitCount}>{String(step1.totalFloors).padStart(2, '0')}</Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => setStep1({ totalFloors: Math.min(20, step1.totalFloors + 1) })}
                >
                  <Ionicons name="add" size={20} color={DesignColors.primary} />
                </Pressable>
              </View>
            </View>
          )}
        </View>

      </ScrollView>

      <View style={styles.ctaRow}>
        <Pressable style={[styles.ctaBtn, !canProceed && styles.ctaBtnDisabled]} onPress={handleForward}>
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
    borderRadius: 12, overflow: 'hidden', backgroundColor: DesignColors.glassBg,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
  },
  inputRounded: { borderRadius: 20 },
  glassBlur: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  textInput: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 14,
    color: DesignColors.onSurface, fontSize: 16, fontFamily,
  },
  layoutRow: { flexDirection: 'row', gap: 12 },
  layoutCard: {
    flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: DesignColors.glassBg,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
    padding: 16, alignItems: 'center', gap: 8,
  },
  layoutCardActive: {
    borderColor: DesignColors.primary,
    backgroundColor: DesignColors.primaryContainer,
  },
  layoutLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  layoutLabelActive: { color: DesignColors.onSurface },
  pricingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currencySign: { fontSize: 20, fontWeight: '700', color: DesignColors.primary, fontFamily, paddingLeft: 16 },
  termPill: {
    flexDirection: 'row', borderRadius: 9999, overflow: 'hidden',
    backgroundColor: DesignColors.glassBg, borderWidth: 1, borderColor: DesignColors.cardBorder,
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
    borderWidth: 1, borderColor: DesignColors.glassBorder,
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
  ctaBtnDisabled: { opacity: 0.4 },

  roomRow: { flexDirection: 'row', gap: 12 },
  roomCard: {
    borderRadius: 12, overflow: 'hidden', backgroundColor: DesignColors.glassBg,
    borderWidth: 1, borderColor: DesignColors.cardBorder, padding: 16, gap: 12, alignItems: 'center',
  },
  roomCardBlur: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  roomLabel: { ...DesignTypography.labelSm, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  roomStepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: DesignColors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  roomCount: { ...DesignTypography.headlineMd, color: DesignColors.primary, fontFamily, width: 28, textAlign: 'center' },

  sizeRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  sizePills: {
    flexDirection: 'row', borderRadius: 9999, overflow: 'hidden',
    backgroundColor: DesignColors.glassBg, borderWidth: 1, borderColor: DesignColors.cardBorder,
    padding: 4,
  },
  sizePill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9999 },
  sizePillActive: { backgroundColor: DesignColors.primaryContainer },
  sizePillText: { fontSize: 13, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily },
  sizePillTextActive: { color: DesignColors.onSurface },
  fieldHint: { fontSize: 11, color: DesignColors.onSurfaceVariant, fontFamily, paddingLeft: 4, opacity: 0.6 },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: DesignColors.outline, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: DesignColors.primary, borderColor: DesignColors.primary },
  checkLabel: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, flex: 1 },
});
