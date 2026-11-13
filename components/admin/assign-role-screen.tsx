import { useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { BackButton } from '@/components/ui/back-button';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors } from '@/constants/design';
import { useAdminCreation } from '@/context/admin-creation-context';
import { useCreateAdminProfile, useRegions } from '@/hooks/use-admin-profiles';
import type { AdminRole } from '@/types/admin';

import { styles } from './assign-role-screen.styles';

type RegionRequirement = 'required' | 'optional' | 'none';

type RoleConfig = {
  key: AdminRole;
  title: string;
  description: string;
  icon: IconName;
  region: RegionRequirement;
};

const ROLE_OPTIONS: RoleConfig[] = [
  {
    key: 'super_admin',
    title: 'Super Admin',
    description: 'Full system ownership. Grants global access to configure geographic regions, manage team structures, override property delegations, and audit system-wide inventory data.',
    icon: 'shield-checkmark',
    region: 'none',
  },
  {
    key: 'regional_admin',
    title: 'Regional Admin',
    description: 'Territory supervisor. Directly manages operations, hubs, and field personnel within a mandatory macro geographic region.',
    icon: 'map',
    region: 'required',
  },
  {
    key: 'field_admin',
    title: 'Field Admin',
    description: 'Localized operations unit. Executes tactical field tasks and manages property queues. Reports up to the Regional Admin of an assigned region, or operates independently when no region is assigned.',
    icon: 'briefcase',
    region: 'optional',
  },
];

type DropdownItem = { id: string; label: string; meta?: string };

type IconName = ComponentProps<typeof Ionicons>['name'];

type SearchableSelectProps = {
  icon: IconName;
  placeholder: string;
  open: boolean;
  selectedId: string | null;
  items: DropdownItem[];
  isLoading?: boolean;
  hint?: string;
  search: string;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onSearch: (text: string) => void;
};

function SearchableSelect(props: SearchableSelectProps) {
  const { icon, placeholder, open, selectedId, items, isLoading, hint, search, onToggle, onSelect, onSearch } = props;
  return (
    <View style={styles.expandSection}>
      {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
      <Pressable style={styles.pickerRow} onPress={onToggle}>
        <Ionicons name={icon} size={18} color={DesignColors.primary} />
        <Text style={[styles.pickerText, !selectedId && styles.pickerPlaceholder]}>
          {items.find((item) => item.id === selectedId)?.label ?? placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={DesignColors.onSurfaceVariant} />
      </Pressable>
      {open && (
        <View style={styles.dropdown}>
          <TextInput
            style={styles.dropdownSearch}
            placeholder="Search..."
            placeholderTextColor={DesignColors.onSurfaceVariant}
            value={search}
            onChangeText={onSearch}
          />
          {isLoading ? (
            <ActivityIndicator size="small" color={DesignColors.primary} style={styles.dropdownLoader} />
          ) : items.length > 0 ? items.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.dropdownItem, selectedId === item.id && styles.dropdownItemSelected]}
              onPress={() => onSelect(item.id)}
            >
              <View style={styles.dropdownItemTextWrap}>
                <Text style={[styles.dropdownText, selectedId === item.id && styles.dropdownTextSelected]}>{item.label}</Text>
                {item.meta ? <Text style={styles.dropdownMeta}>{item.meta}</Text> : null}
              </View>
              {selectedId === item.id && <Ionicons name="checkmark" size={18} color={DesignColors.primary} />}
            </Pressable>
          )) : (
            <Text style={styles.dropdownEmpty}>No matching results</Text>
          )}
        </View>
      )}
    </View>
  );
}

export function AssignRoleScreen() {
  const router = useRouter();
  const { data, setRole, setRegionId, reset } = useAdminCreation();
  const { showToast } = useAppToast();
  const { mutateAsync: createAdmin, isPending } = useCreateAdminProfile();
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(data.role);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(data.regionId);
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');

  const { data: regions = [], isPending: regionsPending, isError: regionsError } = useRegions();

  useEffect(() => {
    if (regionsError) {
      showToast({ message: 'Failed to load regions. Please retry.', type: 'error' });
    }
  }, [regionsError, showToast]);

  const regionItems: DropdownItem[] = regions
    .filter((region) => region.name.toLowerCase().includes(regionSearch.toLowerCase()))
    .map((region) => ({ id: region.id, label: region.name }));

  const isValid = !!data.user && !!selectedRole && (ROLE_OPTIONS.find((opt) => opt.key === selectedRole)?.region !== 'required' || !!selectedRegion);

  const handleSelectRole = (role: AdminRole) => {
    setSelectedRole(role);
    setRegionOpen(false);
    setRegionSearch('');
  };

  const handleContinue = async () => {
    if (!isValid || !selectedRole || !data.user) return;
    setRole(selectedRole);
    setRegionId(selectedRegion);
    try {
      await createAdmin({ id: data.user.id, role: selectedRole, assigned_region_id: selectedRegion });
      reset();
      showToast({ message: 'Admin created successfully.', type: 'success' });
      router.navigate('/admin/manage-teams');
    } catch (error) {
      console.error('[AssignRole] Failed to create admin profile:', error);
      showToast({ message: 'Failed to create admin. Please try again.', type: 'error' });
    }
  };

  return (
    <View style={styles.root}>
      <AuthBackgroundBubbles />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <SafeKeyboardView style={styles.kav}>
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

            {data.user && (
              <View style={styles.userPill}>
                <Ionicons name="person-circle-outline" size={20} color={DesignColors.primary} />
                <Text style={styles.userPillText} numberOfLines={1}>{data.user.full_name}</Text>
              </View>
            )}

            <Text style={styles.subtitle}>
              Define the clearance level for the new administrative profile.
            </Text>

            <View style={styles.optionsList}>
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = selectedRole === opt.key;
                return (
                  <View key={opt.key}>
                    <Pressable
                      style={[styles.optionCard, isSelected && (opt.region !== 'none' ? styles.optionCardExpandable : styles.optionCardSelected)]}
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

                    {isSelected && opt.region !== 'none' && (
                      <SearchableSelect
                        icon="location-outline"
                        placeholder="Select Target Region"
                        hint={opt.region === 'optional' ? 'Optional — skip to assign an independent field admin without a regional restriction.' : undefined}
                        open={regionOpen}
                        selectedId={selectedRegion}
                        items={regionItems}
                        isLoading={regionsPending}
                        search={regionSearch}
                        onToggle={() => { setRegionOpen(!regionOpen); setRegionSearch(''); }}
                        onSelect={(id) => { setSelectedRegion(id); setRegionOpen(false); setRegionSearch(''); }}
                        onSearch={setRegionSearch}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.continueBtn, (!isValid || isPending) && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!isValid || isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={DesignColors.onSurface} />
              ) : (
                <>
                  <Text style={[styles.continueText, !isValid && styles.continueTextDisabled]}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color={isValid ? DesignColors.onSurface : DesignColors.onSurfaceVariant} />
                </>
              )}
            </Pressable>
          </View>
        </SafeKeyboardView>
      </SafeAreaView>
    </View>
  );
}
