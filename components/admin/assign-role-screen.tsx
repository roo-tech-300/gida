import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { BackButton } from '@/components/ui/back-button';
import { DesignColors, fontFamily } from '@/constants/design';
import { useAdminCreation } from '@/context/admin-creation-context';
import { REGIONS, ADMIN_MEMBERS } from '@/dummy/admin-mock';

type RoleOption = 'super_admin' | 'regional_admin' | 'field_admin' | 'independent_field_admin';

type RoleConfig = {
  key: RoleOption;
  title: string;
  description: string;
  icon: string;
  hasRegion: boolean;
  hasSupervisor: boolean;
};

const ROLE_OPTIONS: RoleConfig[] = [
  {
    key: 'super_admin',
    title: 'Super Admin',
    description: 'Full system ownership. Grants global access to configure geographic regions, manage team structures, override property delegations, and audit system-wide inventory data.',
    icon: 'shield-checkmark',
    hasRegion: false,
    hasSupervisor: false,
  },
  {
    key: 'regional_admin',
    title: 'Regional Admin',
    description: 'Territory supervisor. Directly manages operations, hubs, and field personnel within a mandatory macro geographic region.',
    icon: 'map',
    hasRegion: true,
    hasSupervisor: false,
  },
  {
    key: 'field_admin',
    title: 'Field Admin',
    description: 'Localized operations unit. Executes tactical field tasks, manages property queues, and reports directly up to a designated Regional Admin.',
    icon: 'briefcase',
    hasRegion: false,
    hasSupervisor: true,
  },
  {
    key: 'independent_field_admin',
    title: 'Independent Field Admin',
    description: 'Floating field unit. Operates with direct structural clearance to execute verification tasks and manage assigned properties across any zone without a regional middle manager.',
    icon: 'globe',
    hasRegion: false,
    hasSupervisor: false,
  },
];

const regionalSupervisors = ADMIN_MEMBERS.filter((m) => m.role === 'regional_admin');

export function AssignRoleScreen() {
  const router = useRouter();
  const { data, setRole, setRegionId, setSupervisorId } = useAdminCreation();
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(data.role);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(data.regionId);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(data.supervisorId);
  const [regionOpen, setRegionOpen] = useState(false);
  const [supervisorOpen, setSupervisorOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [supervisorSearch, setSupervisorSearch] = useState('');

  const filteredRegions = REGIONS.filter((r) =>
    r.name.toLowerCase().includes(regionSearch.toLowerCase()),
  );
  const filteredSupervisors = regionalSupervisors.filter((s) =>
    s.full_name.toLowerCase().includes(supervisorSearch.toLowerCase()),
  );

  const isValid = (() => {
    if (!selectedRole) return false;
    if (selectedRole === 'regional_admin' && !selectedRegion) return false;
    if (selectedRole === 'field_admin' && !selectedSupervisor) return false;
    return true;
  })();

  const handleContinue = () => {
    if (!isValid || !selectedRole) return;
    setRole(selectedRole);
    setRegionId(selectedRegion);
    setSupervisorId(selectedSupervisor);
    router.back();
  };

  const handleSelectRole = (role: RoleOption) => {
    setSelectedRole(role);
    setRegionOpen(false);
    setSupervisorOpen(false);
    setRegionSearch('');
    setSupervisorSearch('');
  };

  return (
    <View style={styles.root}>
      <AuthBackgroundBubbles />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.backAbs}>
              <BackButton hasBackground />
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Assign Authority</Text>
              <View style={styles.stepBadge}>
                <View style={styles.stepDot} />
                <View style={[styles.stepDot, styles.stepDotActive]} />
                <Text style={styles.stepLabel}>2/2</Text>
              </View>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Define the clearance level for the new administrative profile.
          </Text>

          <View style={styles.optionsList}>
            {ROLE_OPTIONS.map((opt) => {
              const isSelected = selectedRole === opt.key;
              return (
                <View key={opt.key}>
                  <Pressable
                    style={[styles.optionCard, isSelected && (opt.hasRegion || opt.hasSupervisor) ? styles.optionCardExpandable : styles.optionCardSelected]}
                    onPress={() => handleSelectRole(opt.key)}
                  >
                    <View style={styles.optionTop}>
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>{opt.title}</Text>
                        <Text style={styles.optionDesc}>{opt.description}</Text>
                      </View>
                    </View>
                  </Pressable>

                  {isSelected && opt.hasRegion && (
                    <View style={styles.expandSection}>
                      <Pressable
                        style={styles.pickerRow}
                        onPress={() => { setRegionOpen(!regionOpen); setRegionSearch(''); }}
                      >
                        <Ionicons name="location-outline" size={18} color={DesignColors.primary} />
                        <Text style={[styles.pickerText, !selectedRegion && styles.pickerPlaceholder]}>
                          {selectedRegion
                            ? REGIONS.find((r) => r.id === selectedRegion)?.name ?? 'Select Target Region'
                            : 'Select Target Region'}
                        </Text>
                        <Ionicons
                          name={regionOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={DesignColors.onSurfaceVariant}
                        />
                      </Pressable>
                      {regionOpen && (
                        <View style={styles.dropdown}>
                          <TextInput
                            placeholder="Search regions..."
                            placeholderTextColor={DesignColors.onSurfaceVariant}
                            style={styles.dropdownSearch}
                            value={regionSearch}
                            onChangeText={setRegionSearch}
                          />
                          {filteredRegions.length > 0 ? filteredRegions.map((region) => (
                            <Pressable
                              key={region.id}
                              style={[
                                styles.dropdownItem,
                                selectedRegion === region.id && styles.dropdownItemSelected,
                              ]}
                              onPress={() => { setSelectedRegion(region.id); setRegionOpen(false); setRegionSearch(''); }}
                            >
                              <Text style={[
                                styles.dropdownText,
                                selectedRegion === region.id && styles.dropdownTextSelected,
                              ]}>{region.name}</Text>
                              {selectedRegion === region.id && (
                                <Ionicons name="checkmark" size={18} color={DesignColors.primary} />
                              )}
                            </Pressable>
                          )) : (
                            <Text style={styles.dropdownEmpty}>No matching region</Text>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {isSelected && opt.hasSupervisor && (
                    <View style={styles.expandSection}>
                      <Pressable
                        style={styles.pickerRow}
                        onPress={() => { setSupervisorOpen(!supervisorOpen); setSupervisorSearch(''); }}
                      >
                        <Ionicons name="person-outline" size={18} color={DesignColors.primary} />
                        <Text style={[styles.pickerText, !selectedSupervisor && styles.pickerPlaceholder]}>
                          {selectedSupervisor
                            ? regionalSupervisors.find((s) => s.id === selectedSupervisor)?.full_name ?? 'Assign Reporting Supervisor'
                            : 'Assign Reporting Supervisor'}
                        </Text>
                        <Ionicons
                          name={supervisorOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={DesignColors.onSurfaceVariant}
                        />
                      </Pressable>
                      {supervisorOpen && (
                        <View style={styles.dropdown}>
                          <TextInput
                            placeholder="Search supervisors..."
                            placeholderTextColor={DesignColors.onSurfaceVariant}
                            style={styles.dropdownSearch}
                            value={supervisorSearch}
                            onChangeText={setSupervisorSearch}
                          />
                          {filteredSupervisors.length > 0 ? filteredSupervisors.map((sup) => (
                            <Pressable
                              key={sup.id}
                              style={[
                                styles.dropdownItem,
                                selectedSupervisor === sup.id && styles.dropdownItemSelected,
                              ]}
                              onPress={() => { setSelectedSupervisor(sup.id); setSupervisorOpen(false); setSupervisorSearch(''); }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={[
                                  styles.dropdownText,
                                  selectedSupervisor === sup.id && styles.dropdownTextSelected,
                                ]}>{sup.full_name}</Text>
                                <Text style={styles.dropdownMeta}>{sup.region_name}</Text>
                              </View>
                              {selectedSupervisor === sup.id && (
                                <Ionicons name="checkmark" size={18} color={DesignColors.primary} />
                              )}
                            </Pressable>
                          )) : (
                            <Text style={styles.dropdownEmpty}>No matching supervisor</Text>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={[styles.continueText, !isValid && styles.continueTextDisabled]}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={isValid ? '#ffffff' : DesignColors.onSurfaceVariant} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safe: { flex: 1 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingBottom: 12, paddingTop: 8,
  },
  backAbs: { position: 'absolute', left: 0 },
  headerCenter: { alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  stepBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepDotActive: {
    backgroundColor: DesignColors.primary,
    width: 8, height: 8, borderRadius: 4,
  },
  stepLabel: {
    fontSize: 11, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily,
    marginLeft: 2,
  },

  subtitle: {
    fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily,
    lineHeight: 20, paddingBottom: 24, opacity: 0.8,
  },

  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },

  optionsList: { gap: 12 },

  optionCard: {
    borderRadius: 20, padding: 18,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  optionCardSelected: {
    borderColor: 'rgba(79,70,229,0.5)',
  },
  optionCardExpandable: {
    borderColor: 'rgba(79,70,229,0.5)',
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  optionTop: { flexDirection: 'row', gap: 14 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: DesignColors.primary,
  },
  radioInner: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: DesignColors.primary,
  },
  optionContent: { flex: 1, gap: 6 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  optionDesc: {
    fontSize: 13, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily,
    lineHeight: 18, opacity: 0.7,
  },

  expandSection: {
    paddingHorizontal: 18, paddingBottom: 20,
    backgroundColor: DesignColors.surface,
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(79,70,229,0.5)',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: 2,
  },
  pickerText: { flex: 1, fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  pickerPlaceholder: { color: DesignColors.onSurfaceVariant, opacity: 0.6 },

  dropdown: {
    marginTop: 6, borderRadius: 12, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 14,
  },
  dropdownItemSelected: { backgroundColor: 'rgba(79,70,229,0.12)' },
  dropdownText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  dropdownTextSelected: { color: DesignColors.primary },
  dropdownMeta: { fontSize: 11, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2, opacity: 0.6 },
  dropdownSearch: {
    fontSize: 13, fontWeight: '600', color: DesignColors.onSurface, fontFamily,
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  dropdownEmpty: {
    paddingVertical: 16, textAlign: 'center',
    fontSize: 13, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.5,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingVertical: 32,
  },
  continueBtn: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: DesignColors.primaryContainer,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  continueBtnDisabled: { backgroundColor: '#6b64b0' },
  continueText: { fontSize: 17, fontWeight: '700', color: '#ffffff', fontFamily },
  continueTextDisabled: { color: DesignColors.onSurfaceVariant },
});
