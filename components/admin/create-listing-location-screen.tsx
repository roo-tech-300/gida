import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useCreateListingForm } from '@/context/create-listing-context';
import { getSchoolsForCity, getCampusesForSchool } from '@/types/onboarding';

export function CreateListingLocationScreen() {
  const { profile } = useAuth();
  const { data, setStep2 } = useCreateListingForm();
  const { step2 } = data;
  const [lockLoading, setLockLoading] = useState(false);
  const [operatingCity, setOperatingCity] = useState('');
  const [schoolOpen, setSchoolOpen] = useState(false);

  useEffect(() => {
    if (profile?.city) setOperatingCity(profile.city);
  }, [profile?.city]);

  const schools = getSchoolsForCity(operatingCity);
  const campuses = step2.selectedSchool ? getCampusesForSchool(step2.selectedSchool) : [];

  const lockLocation = async () => {
    setLockLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to lock your property coordinates.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setStep2({ coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude } });
    } catch {
      Alert.alert('Error', 'Could not fetch your location. Make sure GPS is enabled.');
    } finally {
      setLockLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#0e0e10' }}
      >
        <View style={styles.topBar}>
          <View />
          <Text style={styles.stepIndicator}>Step 2 of 5</Text>
        </View>

        <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Listing Location</Text>
          <Text style={styles.heroSub}>Set the exact location so students can find you easily</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>School Name</Text>
          <Pressable style={styles.glassInput} onPress={() => setSchoolOpen(!schoolOpen)}>
            <View style={styles.selectRow}>
              <Text style={[styles.selectValue, !step2.selectedSchool && styles.selectPlaceholder]}>
                {step2.selectedSchool || 'Select a school'}
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
                    style={[styles.dropdownOption, step2.selectedSchool === school && styles.dropdownOptionActive]}
                    onPress={() => {
                      setStep2({ selectedSchool: school, selectedCampus: null });
                      setSchoolOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, step2.selectedSchool === school && styles.dropdownOptionTextActive]}>
                      {school}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          )}
        </View>

        {step2.selectedSchool && campuses.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Select Campus</Text>
            <View style={styles.campusList}>
              {campuses.map((c) => {
                const active = step2.selectedCampus === c.id;
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.campusCard, active && styles.campusCardActive]}
                    onPress={() => setStep2({ selectedCampus: c.id })}
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

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nearest Landmark</Text>
          <View style={styles.glassInput}>
            <BlurView intensity={25} tint="dark" style={styles.glassBlur} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Behind GK Main Gate, near Chapel of Grace"
              placeholderTextColor="rgba(199,196,216,0.4)"
              value={step2.landmark}
              onChangeText={(v) => setStep2({ landmark: v })}
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
                  This lets students navigate directly to the listing door.
                </Text>
              </View>
            </View>
            <Pressable style={[styles.lockBtn, step2.coords && styles.lockBtnActive]} onPress={lockLocation} disabled={lockLoading}>
              <Ionicons
                name={lockLoading ? 'hourglass-outline' : step2.coords ? 'checkmark-circle-outline' : 'locate-outline'}
                size={20}
                color={step2.coords ? '#0e0e10' : DesignColors.secondary}
              />
              <Text style={[styles.lockBtnText, step2.coords && styles.lockBtnTextActive]}>
                {lockLoading ? 'Locking...' : step2.coords ? `${step2.coords.latitude.toFixed(4)}, ${step2.coords.longitude.toFixed(4)}` : 'Lock Live Location'}
              </Text>
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
  lockBtnActive: { backgroundColor: DesignColors.secondary, borderColor: DesignColors.secondary },
  lockBtnTextActive: { color: '#0e0e10' },
  lockBtnText: { fontSize: 15, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  mapDeco: { height: 96, borderRadius: 12, backgroundColor: '#0e0e10', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  mapPin: { alignItems: 'center', justifyContent: 'center' },
  mapPinGlow: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(79,70,229,0.15)' },
  ctaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  ctaBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: DesignColors.primaryContainer, alignItems: 'center', justifyContent: 'center', shadowColor: DesignColors.primaryContainer, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
});
