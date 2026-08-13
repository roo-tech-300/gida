import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { DesignColors, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { fetchRegions, type RegionRow } from '@/services/regionService';

const UNASSIGNED = 'unassigned';

type Props = {
  regionPath: string[];
  onSelect: (path: string[]) => void;
};

export function ListingRegionSelect({ regionPath, onSelect }: Props) {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.admin_role === 'super_admin';
  const isRegionalAdmin = profile?.admin_role === 'regional_admin';
  const assignedRegionId = profile?.assigned_region_id ?? null;

  const { data: regions = [], isLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
    staleTime: 60_000,
  });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const regionById = useMemo(() => new Map(regions.map((region) => [region.id, region])), [regions]);

  const pathOf = useCallback(
    (regionId: string): string[] => {
      const path: string[] = [];
      const visited = new Set<string>();
      let current: RegionRow | undefined = regionById.get(regionId);
      while (current && !visited.has(current.id)) {
        visited.add(current.id);
        path.unshift(current.id);
        current = current.parent_region_id ? regionById.get(current.parent_region_id) : undefined;
      }
      return path;
    },
    [regionById],
  );

  const visibleRegions = isRegionalAdmin
    ? regions.filter((region) => !!assignedRegionId && pathOf(region.id).includes(assignedRegionId))
    : regions;

  const filteredRegions = visibleRegions.filter((region) =>
    region.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const selectedId = regionPath.length > 0 ? regionPath[regionPath.length - 1] : null;
  const selectedRegion = regionById.get(selectedId ?? '');

  const handleSelect = (regionId: string) => {
    if (regionId === UNASSIGNED) {
      onSelect([]);
    } else {
      const region = regionById.get(regionId);
      onSelect(region ? pathOf(region.id) : []);
    }
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
            <Ionicons name="git-network-outline" size={18} color={DesignColors.primary} />
            <Text style={[styles.selectValue, !selectedRegion && styles.selectPlaceholder]}>
              {selectedRegion ? selectedRegion.name : 'Select a region'}
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
              placeholder="Search regions..."
              placeholderTextColor={DesignColors.onSurfaceVariant}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={DesignColors.primary} style={styles.loader} />
          ) : isSuperAdmin ? (
            <>
              <Pressable
                style={[styles.dropdownOption, !selectedRegion && styles.dropdownOptionActive]}
                onPress={() => handleSelect(UNASSIGNED)}
              >
                <Text style={[styles.dropdownOptionText, !selectedRegion && styles.dropdownOptionTextActive]}>
                  Unassigned
                </Text>
              </Pressable>
              {filteredRegions.map((region) => (
                <Pressable
                  key={region.id}
                  style={[styles.dropdownOption, region.id === selectedId && styles.dropdownOptionActive]}
                  onPress={() => handleSelect(region.id)}
                >
                  <Text style={[styles.dropdownOptionText, region.id === selectedId && styles.dropdownOptionTextActive]}>
                    {region.name}
                  </Text>
                </Pressable>
              ))}
            </>
          ) : (
            filteredRegions.map((region) => (
              <Pressable
                key={region.id}
                style={[styles.dropdownOption, region.id === selectedId && styles.dropdownOptionActive]}
                onPress={() => handleSelect(region.id)}
              >
                <Text style={[styles.dropdownOptionText, region.id === selectedId && styles.dropdownOptionTextActive]}>
                  {region.name}
                </Text>
              </Pressable>
            ))
          )}
          {!isLoading && filteredRegions.length === 0 && (
            <Text style={styles.dropdownEmpty}>
              {visibleRegions.length === 0 ? 'No regions available' : 'No matching regions'}
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
  dropdownEmpty: {
    padding: 16,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontSize: 14,
    textAlign: 'center',
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
  dropdownOption: { paddingHorizontal: 16, paddingVertical: 14 },
  dropdownOptionActive: { backgroundColor: DesignColors.primaryContainer },
  dropdownOptionText: { fontSize: 15, color: DesignColors.onSurface, fontFamily },
  dropdownOptionTextActive: { color: DesignColors.primary, fontWeight: '600' },
  loader: { paddingVertical: 24 },
});
