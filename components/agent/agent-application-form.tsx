import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { DesignSpacing } from '@/constants/design';
import { CAMPUS_MAP, CITIES } from '@/constants/agent-form-data';
import { useAuth } from '@/context/auth-context';
import { submitAgentApplication, verifySugKey } from '@/services/agentService';
import { FormInput } from './form-input';
import { FormDropdown } from './form-dropdown';
import { ToggleRow } from './form-toggle-row';
import { SubmitOverlay } from './submit-overlay';
import { styles } from './form-styles';

export function AgentApplicationForm() {
  const insets = useSafeAreaInsets();
  const { profile, refreshProfile } = useAuth();
  const [agencyName, setAgencyName] = useState('');
  const [city, setCity] = useState('');
  const [caterToStudents, setCaterToStudents] = useState(false);
  const [campus, setCampus] = useState('');
  const [hasSug, setHasSug] = useState(false);
  const [sugKey, setSugKey] = useState('');
  const [sugError, setSugError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const campuses = useMemo(() => (city ? CAMPUS_MAP[city] ?? [] : []), [city]);

  const handleSubmit = async () => {
    if (!agencyName.trim() || !city || !profile?.id) return;
    setIsSubmitting(true);
    setSugError('');
    const d = { agencyName: agencyName.trim(), city: city.trim(), catersToStudents: caterToStudents, targetCampus: campus.trim() || null };
    try {
      if (hasSug) {
        const check = await verifySugKey(d.agencyName, sugKey.trim());
        if (!check.valid) { setIsSubmitting(false); setSugError('Verification failed. Please double-check your business name spelling or verification key.'); return; }
        await submitAgentApplication(profile.id, d, check.tokenId);
      } else { await submitAgentApplication(profile.id, d); }
      await refreshProfile();
      await new Promise((r) => setTimeout(r, 1300));
      setIsSubmitting(false);
      router.replace('/agent/portfolio');
    } catch (err) { setIsSubmitting(false); Alert.alert('Submission Failed', err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  return (
    <View style={styles.safe}>
      <AuthBackgroundBubbles />
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>Agent Registration</Text>
        </View>
      </SafeAreaView>
      <ScrollView bounces={false} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Earn with Gida</Text>
          <Text style={styles.heroSub}>Join our network of premium property hosts and manage your portfolio with advanced synchronization tools.</Text>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>AGENCY / BUSINESS NAME</Text>
          <FormInput icon="business" placeholder="e.g., FUTMinna Student Housing Hub" value={agencyName} onChangeText={setAgencyName} />
          <Text style={styles.caption}>Ensure you use the exact business name the SUG recognizes you as, or else your verification key won't work.</Text>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>PRIMARY OPERATING CITY</Text>
          <FormDropdown icon="location-outline" value={city} options={CITIES} onSelect={setCity} />
        </View>
        <ToggleRow label="Has SUG Verification?" value={hasSug} onChange={setHasSug} />
        {hasSug && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>SUG VERIFICATION KEY</Text>
            <FormInput icon="key-outline" placeholder="e.g., SUG-APEX-9842" value={sugKey} onChangeText={setSugKey} />
            {sugError ? <Text style={styles.error}>{sugError}</Text> : null}
          </View>
        )}
        <ToggleRow label="Cater to Student Demographic?" value={caterToStudents} onChange={setCaterToStudents} />
        {caterToStudents && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PRIMARY TARGET CAMPUS</Text>
            <FormDropdown icon="school-outline" value={campus} options={campuses} onSelect={setCampus} />
          </View>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, DesignSpacing.md) }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={!agencyName.trim() || !city || isSubmitting}
          style={[styles.submitBtn, (!agencyName.trim() || !city || isSubmitting) && styles.submitDisabled]}
        >
          <Text style={styles.submitText}>Submit Application</Text>
        </Pressable>
      </View>
      <SubmitOverlay visible={isSubmitting} />
    </View>
  );
}
