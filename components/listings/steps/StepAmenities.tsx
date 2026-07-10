import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

type Amenity = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  section: 'utilities' | 'disclosures';
};

const amenities: Amenity[] = [
  { key: 'has_borehole', label: 'Borehole', icon: 'water-outline', section: 'utilities' },
  { key: 'has_generator', label: 'Generator', icon: 'flash-outline', section: 'utilities' },
  { key: 'has_internet', label: 'Internet', icon: 'wifi-outline', section: 'utilities' },
  { key: 'has_fenced_gate', label: 'Fenced Gate', icon: 'shield-outline', section: 'utilities' },
  { key: 'has_burglary', label: 'Burglary Proofing', icon: 'lock-closed-outline', section: 'utilities' },
  { key: 'has_cabinet', label: 'Cabinet', icon: 'layers-outline', section: 'utilities' },
  { key: 'has_wardrobe', label: 'Wardrobe', icon: 'shirt-outline', section: 'utilities' },
  { key: 'is_shared_bathroom', label: 'Shared Bathroom', icon: 'people-outline', section: 'disclosures' },
  { key: 'is_shared_kitchen', label: 'Shared Kitchen', icon: 'restaurant-outline', section: 'disclosures' },
];

export function StepAmenities() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [featuresList, setFeaturesList] = useState<string[]>([]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleChange = (val: string) => {
    if (!val.includes(',')) {
      setInputValue(val);
      return;
    }
    const parts = val.split(',');
    const newToken = parts[0].trim();
    if (newToken.length > 0) {
      setFeaturesList((prev) => [...prev, newToken]);
    }
    setInputValue(parts.slice(1).join(',').trimStart());
  };

  const handlePillPress = (pill: string) => {
    setFeaturesList((prev) => prev.filter((p) => p !== pill));
    setInputValue(pill + ' ');
  };

  const utilities = amenities.filter((a) => a.section === 'utilities');
  const disclosures = amenities.filter((a) => a.section === 'disclosures');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.topBar}>
          <View />
          <Text style={styles.stepIndicator}>Step 3 of 4</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heroTitle}>Lodge Amenities</Text>
          <Text style={styles.heroSub}>Tap to toggle features available at the property.</Text>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Property Utilities</Text>
            <View style={styles.grid}>
              {utilities.map((a) => {
                const active = selected.has(a.key);
                return (
                  <Pressable
                    key={a.key}
                    style={[styles.tile, active && styles.tileActive]}
                    onPress={() => toggle(a.key)}
                  >
                    <View style={styles.tileInner}>
                      <Ionicons
                        name={a.icon}
                        size={28}
                        color={active ? DesignColors.primary : DesignColors.onSurfaceVariant}
                      />
                      <Text style={[styles.tileLabel, active && styles.tileLabelActive]}>
                        {a.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Layout Disclosures</Text>
            <View style={styles.grid}>
              {disclosures.map((a) => {
                const active = selected.has(a.key);
                return (
                  <Pressable
                    key={a.key}
                    style={[styles.tile, active && styles.tileActive]}
                    onPress={() => toggle(a.key)}
                  >
                    <View style={styles.tileInner}>
                      <Ionicons
                        name={a.icon}
                        size={28}
                        color={active ? DesignColors.primary : DesignColors.onSurfaceVariant}
                      />
                      <Text style={[styles.tileLabel, active && styles.tileLabelActive]}>
                        {a.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Other Custom Features</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="e.g. Balcony, POP Ceiling"
              placeholderTextColor="#64748b"
              value={inputValue}
              onChangeText={handleChange}
              onSubmitEditing={() => {
                const trimmed = inputValue.trim();
                if (trimmed.length > 0) {
                  setFeaturesList((prev) => [...prev, trimmed]);
                  setInputValue('');
                }
              }}
              returnKeyType="done"
            />
            <Text style={styles.fieldHint}>Comma-separated list</Text>

            {featuresList.length > 0 && (
              <View style={styles.pillWrap}>
                {featuresList.map((pill, i) => (
                  <Pressable
                    key={`${pill}-${i}`}
                    style={styles.pill}
                    onPress={() => handlePillPress(pill)}
                  >
                    <Text style={styles.pillText}>{pill}</Text>
                    <Text style={styles.pillIcon}>✎</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.actionDeck}>
          <View style={styles.deckBtn}>
            <Ionicons name="chevron-back" size={24} color={DesignColors.onSurface} />
          </View>
          <View style={styles.deckBtnPrimary}>
            <Ionicons name="arrow-forward" size={24} color={DesignColors.onPrimaryContainer} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  kav: { flex: 1, backgroundColor: '#0E0E10' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  stepIndicator: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 16 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.5 },
  heroSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: -8 },
  sectionWrap: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%', aspectRatio: 1, borderRadius: 12, padding: 16,
    backgroundColor: 'rgba(24,24,28,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tileInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  tileActive: {
    borderColor: DesignColors.primary,
    backgroundColor: 'rgba(79,70,229,0.1)',
  },
  tileLabel: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
  tileLabelActive: { color: DesignColors.onSurface },
  inputBox: {
    backgroundColor: '#18181C', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 14, fontFamily,
  },
  fieldHint: { fontSize: 11, color: '#64748b', marginTop: 4, paddingLeft: 4, fontFamily },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: {
    backgroundColor: 'rgba(79,70,229,0.1)',
    borderWidth: 1, borderColor: 'rgba(79,70,229,0.2)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: '#818CF8', fontFamily, letterSpacing: 0.3 },
  pillIcon: { opacity: 0.4, fontSize: 10, color: '#818CF8' },
  actionDeck: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  deckBtn: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(24,24,28,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  deckBtnPrimary: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
});
