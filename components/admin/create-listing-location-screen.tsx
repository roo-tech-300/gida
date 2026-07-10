import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { getSchoolsForCity, getCampusesForSchool } from '@/types/onboarding';

export function CreateListingLocationScreen() {
  const { profile } = useAuth();
  const [operatingCity, setOperatingCity] = useState('');
  const [catersToStudents, setCatersToStudents] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [landmark, setLandmark] = useState('');

  useEffect(() => {
    if (profile?.city) setOperatingCity(profile.city);
  }, [profile?.city]);

  const schools = getSchoolsForCity(operatingCity);
  const campuses = selectedSchool ? getCampusesForSchool(selectedSchool) : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#0e0e10' }}
      >
        <View style={styles.topBar}>
          <View />
          <Text style={styles.stepIndicator}>Step 2 of 4</Text>
        </View>

        <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Lodge Locations</Text>
          <Text style={styles.heroSub}>Set the exact location so students can find you easily</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Pressable style={styles.checkRow} onPress={() => setCatersToStudents(!catersToStudents)}>
            <View style={[styles.checkbox, catersToStudents && styles.checkboxActive]}>
              {catersToStudents && <Ionicons name="checkmark" size={16} color={DesignColors.onPrimary} />}
            </View>
            <Text style={styles.checkLabel}>This property caters to students</Text>
          </Pressable>
        </View>

        {catersToStudents && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>School Name</Text>
              <Pressable style={styles.glassInput} onPress={() => setSchoolOpen(!schoolOpen)}>
                <View style={styles.selectRow}>
                  <Text style={[styles.selectValue, !selectedSchool && styles.selectPlaceholder]}>
                    {selectedSchool || 'Select a school'}
                  </Text>
                  <Ionicons name={schoolOpen ? 'chevron-up' : 'chevron-down'} size={20} color={DesignColors.onSurfaceVariant} />
                </View>
              </Pressable>
              {schoolOpen && (
                <View style={styles.dropdownList}>
                  {schools.length === 0 ? (
                    <Text style={styles.dropdownEmpty}>No schools found for {operatingCity}</Text>
                  ) : (
                    schools.map((school) => (
                      <Pressable
                        key={school}
                        style={[styles.dropdownOption, selectedSchool === school && styles.dropdownOptionActive]}
                        onPress={() => {
                          setSelectedSchool(school);
                          setSelectedCampus(null);
                          setSchoolOpen(false);
                        }}
                      >
                        <Text style={[styles.dropdownOptionText, selectedSchool === school && styles.dropdownOptionTextActive]}>
                          {school}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              )}
            </View>

            {selectedSchool && campuses.length > 0 && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Select Campus</Text>
                <View style={styles.campusList}>
                  {campuses.map((c) => {
                    const active = selectedCampus === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        style={[styles.campusCard, active && styles.campusCardActive]}
                        onPress={() => setSelectedCampus(c.id)}
                      >
                        <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
                        <View style={styles.campusLeft}>
                          <View style={[styles.schoolIconWrap, active && styles.schoolIconWrapActive]}>
                            <Ionicons
                              name="school-outline"
                              size={20}
                              color={active ? DesignColors.primary : DesignColors.onSurfaceVariant}
                            />
                          </View>
                          <Text style={[styles.campusLabel, active && styles.campusLabelActive]}>
                            {c.label}
                          </Text>
                        </View>
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={active ? DesignColors.primary : 'transparent'}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nearest Landmark</Text>
          <View style={styles.glassInput}>
            <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Behind GK Main Gate, near Chapel of Grace"
              placeholderTextColor="rgba(199,196,216,0.4)"
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.gpsCard}>
            <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
            <View style={styles.gpsHeader}>
              <View style={styles.gpsIconWrap}>
                <Ionicons name="globe-outline" size={32} color={DesignColors.secondary} />
              </View>
              <View style={styles.gpsText}>
                <Text style={styles.gpsTitle}>Precise Layout Mapping</Text>
                <Text style={styles.gpsDesc}>
                  Stand physically inside the property to lock down precise layout mapping.{'\n'}
                  This lets students navigate directly to the lodge door.
                </Text>
              </View>
            </View>
            <Pressable style={styles.lockBtn}>
              <Ionicons name="locate-outline" size={20} color={DesignColors.secondary} />
              <Text style={styles.lockBtnText}>Lock Live Location</Text>
            </Pressable>
            <View style={styles.mapDeco}>
              <View style={styles.mapPin}>
                <View style={styles.mapPinGlow} />
                <Ionicons name="location" size={20} color={DesignColors.primary} />
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      <View style={styles.ctaRow}>
        <Pressable style={styles.ctaBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={DesignColors.onPrimaryContainer} />
        </Pressable>
        <Pressable style={styles.ctaBtn} onPress={() => router.push('/admin/create-listing-amenities')}>
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24, paddingBottom: 24 },
  hero: { paddingTop: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.5 },
  heroSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 4 },
  fieldGroup: { gap: 8 },
  label: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  glassInput: { borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(24,24,28,0.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  glassBlur: { ...StyleSheet.absoluteFillObject },
  textInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, color: DesignColors.onSurface, fontSize: 16, fontFamily },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: DesignColors.outline, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: DesignColors.primary, borderColor: DesignColors.primary },
  checkLabel: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, flex: 1 },
  selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  selectValue: { fontSize: 16, color: DesignColors.onSurface, fontFamily, flex: 1 },
  selectPlaceholder: { color: 'rgba(199,196,216,0.4)' },
  dropdownList: { borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(24,24,28,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dropdownEmpty: { padding: 16, color: DesignColors.onSurfaceVariant, fontFamily, fontSize: 14, textAlign: 'center' },
  dropdownOption: { paddingHorizontal: 16, paddingVertical: 14 },
  dropdownOptionActive: { backgroundColor: 'rgba(79,70,229,0.12)' },
  dropdownOptionText: { fontSize: 15, color: DesignColors.onSurface, fontFamily },
  dropdownOptionTextActive: { color: DesignColors.primary, fontWeight: '600' },
  campusList: { gap: 12 },
  campusCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(24,24,28,0.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16 },
  campusCardActive: { borderColor: DesignColors.primary, shadowColor: DesignColors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  campusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  schoolIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(79,70,229,0.08)', alignItems: 'center', justifyContent: 'center' },
  schoolIconWrapActive: { backgroundColor: 'rgba(79,70,229,0.15)' },
  campusLabel: { ...DesignTypography.bodyMd, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  campusLabelActive: { color: DesignColors.onSurface },
  gpsCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(24,24,28,0.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20, gap: 16 },
  gpsHeader: { flexDirection: 'row', gap: 16 },
  gpsIconWrap: { flexShrink: 0 },
  gpsText: { gap: 4, flex: 1 },
  gpsTitle: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  gpsDesc: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 18 },
  lockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: DesignColors.surfaceContainerHigh, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  lockBtnText: { fontSize: 15, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  mapDeco: { height: 96, borderRadius: 12, backgroundColor: '#0e0e10', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  mapPin: { alignItems: 'center', justifyContent: 'center' },
  mapPinGlow: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(79,70,229,0.15)' },
  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  ctaBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: DesignColors.primaryContainer, alignItems: 'center', justifyContent: 'center', shadowColor: DesignColors.primaryContainer, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
});
