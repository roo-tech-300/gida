import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { DesignColors, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { fetchAdminProfiles } from '@/services/adminService';
import type { AdminRole } from '@/types/admin';

type Props = {
  selectedAdminId: string | null;
  onSelect: (adminId: string | null) => void;
};

function roleLabel(role: AdminRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'regional_admin':
      return 'Regional Admin';
    case 'field_admin':
      return 'Field Admin';
  }
}

export function AdminTransferSelect({ selectedAdminId, onSelect }: Props) {
  const { profile } = useAuth();
  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: fetchAdminProfiles,
    staleTime: 60_000,
  });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedAdmin = admins.find((admin) => admin.id === selectedAdminId) ?? null;

  const filteredAdmins = admins.filter((admin) =>
    admin.full_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const handleSelect = (adminId: string | null) => {
    onSelect(adminId);
    setOpen(false);
    setSearch('');
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.glassInput}
        onPress={() => {
          setOpen((prev) => !prev);
          setSearch('');
        }}
      >
        <View style={styles.selectRow}>
          <View style={styles.valueWrap}>
            <Ionicons name="swap-horizontal-outline" size={18} color={DesignColors.primary} />
            <Text style={[styles.selectValue, !selectedAdmin && styles.selectPlaceholder]} numberOfLines={1}>
              {selectedAdmin
                ? selectedAdmin.id === profile?.id
                  ? `${selectedAdmin.full_name} (you)`
                  : selectedAdmin.full_name
                : 'Keep current owner'}
            </Text>
          </View>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={DesignColors.onSurfaceVariant} />
        </View>
      </Pressable>

      {open && (
        <View style={styles.dropdownList}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={DesignColors.onSurfaceVariant} />
            <TextInput
              style={styles.dropdownSearch}
              placeholder="Search admins..."
              placeholderTextColor={DesignColors.onSurfaceVariant}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={DesignColors.primary} style={styles.loader} />
          ) : (
            <>
              <Pressable
                style={[styles.dropdownOption, !selectedAdminId && styles.dropdownOptionActive]}
                onPress={() => handleSelect(null)}
              >
                <Text style={[styles.dropdownOptionText, !selectedAdminId && styles.dropdownOptionTextActive]}>
                  Keep current owner
                </Text>
              </Pressable>
              {filteredAdmins.map((admin) => {
                const active = admin.id === selectedAdminId;
                return (
                  <Pressable
                    key={admin.id}
                    style={[styles.dropdownOption, active && styles.dropdownOptionActive]}
                    onPress={() => handleSelect(admin.id)}
                  >
                    <View style={styles.optionMain}>
                      <Text style={[styles.dropdownOptionText, active && styles.dropdownOptionTextActive]} numberOfLines={1}>
                        {admin.full_name}
                      </Text>
                      <View style={styles.metaRow}>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleBadgeText}>{roleLabel(admin.role)}</Text>
                        </View>
                        {admin.region_name ? (
                          <Text style={styles.regionName} numberOfLines={1}>{admin.region_name}</Text>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
          {!isLoading && filteredAdmins.length === 0 && (
            <Text style={styles.dropdownEmpty}>
              {admins.length === 0 ? 'No admins available' : 'No matching admins'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  glassInput: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: DesignColors.glassBg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  selectValue: { fontSize: 16, color: DesignColors.onSurface, fontFamily, flex: 1 },
  selectPlaceholder: { color: DesignColors.onSurfaceVariant },
  dropdownList: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  dropdownSearch: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: DesignColors.onSurface,
    fontFamily,
  },
  dropdownEmpty: {
    padding: 16,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontSize: 14,
    textAlign: 'center',
  },
  dropdownOption: { paddingHorizontal: 16, paddingVertical: 12 },
  dropdownOptionActive: { backgroundColor: DesignColors.primaryContainer },
  dropdownOptionText: { fontSize: 15, color: DesignColors.onSurface, fontFamily },
  dropdownOptionTextActive: { color: DesignColors.primary, fontWeight: '600' },
  optionMain: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: {
    backgroundColor: DesignColors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleBadgeText: { fontSize: 11, fontWeight: '600', color: DesignColors.primary, fontFamily },
  regionName: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily, flexShrink: 1 },
  loader: { paddingVertical: 24 },
});
