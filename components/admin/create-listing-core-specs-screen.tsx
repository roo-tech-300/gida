import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { WebBlurView } from '@/components/ui/web-blur-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { LandlordSearch } from '@/components/admin/landlord-search';
import { useExitListingWizard } from '@/hooks/use-exit-listing-wizard';
import { DesignColors } from '@/constants/design';
import { useCreateListingForm } from '@/context/create-listing-context';
import { useAppToast } from '@/components/ui/toast-card';

import { styles } from './create-listing-core-specs-screen.styles';
import { RoomCountCard } from '@/components/admin/room-count-card';
import { formatPriceInput, layoutRoomDefaults, validateCoreSpecs } from '@/utils/listing-input';

const layoutOptions: { key: 'self_contain' | 'single_room' | 'flat'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'single_room', label: 'Single Room', icon: 'albums-outline' },
  { key: 'self_contain', label: 'Self-Contain', icon: 'bed-outline' },
  { key: 'flat', label: 'Flat', icon: 'business-outline' },
];

export function CreateListingCoreSpecsScreen() {
  const { data, setStep1 } = useCreateListingForm();
  const { step1 } = data;
  const { showToast } = useAppToast();
  const exitWizard = useExitListingWizard();

  const canProceed = step1.title.trim() && step1.landlordId && step1.layoutType && step1.price;
  const handleForward = () => {
    const problem = validateCoreSpecs(step1);
    if (problem) {
      showToast({ message: problem, type: 'error' });
      return;
    }
    router.push('/admin/create-listing-location');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SafeKeyboardView
        style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }}
      >
        <View style={styles.topBar}>
          <BackButton hasBackground={false} onPress={exitWizard} />
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
            <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Royal Heights Apartments"
              placeholderTextColor={DesignColors.divider}
              value={step1.title}
              onChangeText={(v) => setStep1({ title: v })}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description</Text>
          <View style={[styles.glassInput, styles.inputRounded]}>
            <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
            <TextInput
              style={[styles.textInput, { minHeight: 100, textAlignVertical: 'top' }]}
              placeholder="Describe the proximity to campus, water availability, and security features..."
              placeholderTextColor={DesignColors.divider}
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
                    setStep1({ layoutType: opt.key, ...layoutRoomDefaults(opt.key, step1.bedrooms, step1.bathrooms) });
                  }}
                >
                  <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
                  <Ionicons name={opt.icon} size={24} color={active ? DesignColors.primary : DesignColors.onSurfaceVariant} />
                  <Text style={[styles.layoutLabel, active && styles.layoutLabelActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {step1.layoutType === 'flat' && (
          <View style={styles.roomRow}>
            <RoomCountCard label="Bedrooms" value={step1.bedrooms} onChange={(bedrooms) => setStep1({ bedrooms })} />
            <RoomCountCard label="Bathrooms" value={step1.bathrooms} onChange={(bathrooms) => setStep1({ bathrooms })} />
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Pricing & Terms</Text>
          <View style={styles.pricingRow}>
            <View style={[styles.glassInput, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
              <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <Text style={styles.currencySign}>₦</Text>
              <TextInput
                style={styles.textInput}
                placeholder="250,000"
                placeholderTextColor={DesignColors.divider}
                value={step1.price}
                onChangeText={(text) => setStep1({ price: formatPriceInput(text) })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.termBadge}>
              <Text style={styles.termBadgeText}>Per Annum</Text>
            </View>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Size <Text style={styles.optional}>(optional)</Text></Text>
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
              <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
              <TextInput
                style={styles.textInput}
                placeholder={step1.sizeUnit === 'sqft' ? 'e.g. 1,200' : 'e.g. 112'}
                placeholderTextColor={DesignColors.divider}
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
            <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
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
              <WebBlurView intensity={25} tint="dark" style={styles.glassBlur} />
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
      </SafeKeyboardView>
    </SafeAreaView>
  );
}
