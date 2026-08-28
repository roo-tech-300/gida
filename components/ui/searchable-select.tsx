import { useState, type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';

export type SelectItem = { id: string; label: string; meta?: string };
type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon?: IconName;
  placeholder: string;
  hint?: string;
  selectedId: string | null;
  items: SelectItem[];
  isLoading?: boolean;
  onSelect: (id: string) => void;
};

export function SearchableSelect({ icon, placeholder, hint, selectedId, items, isLoading, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = items.find((item) => item.id === selectedId);
  const filtered = items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setSearch('');
  };

  return (
    <View style={styles.wrap}>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <Pressable style={styles.field} onPress={() => setOpen((o) => !o)}>
        {icon ? <Ionicons name={icon} size={18} color={DesignColors.primary} /> : null}
        <Text
          numberOfLines={1}
          style={[styles.value, !selected && styles.placeholder]}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={DesignColors.onSurfaceVariant} />
      </Pressable>

      {open && (
        <View style={styles.dropdown}>
          <TextInput
            style={styles.search}
            placeholder="Search..."
            placeholderTextColor={DesignColors.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
          />
          {isLoading ? (
            <ActivityIndicator size="small" color={DesignColors.primary} style={styles.loader} />
          ) : filtered.length > 0 ? (
            <View style={styles.options}>
              {filtered.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(item.id)}
                  >
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{item.label}</Text>
                      {item.meta ? <Text style={styles.optionMeta}>{item.meta}</Text> : null}
                    </View>
                    {isSelected && <Ionicons name="checkmark" size={18} color={DesignColors.primary} />}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.empty}>No matching results</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  hint: {
    fontSize: 12, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily,
    lineHeight: 17, opacity: 0.7,
  },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: DesignColors.borderFaint,
    borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  value: { flex: 1, fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  placeholder: { color: DesignColors.onSurfaceVariant, opacity: 0.6 },
  dropdown: {
    marginTop: 2, borderRadius: 12, overflow: 'hidden',
    backgroundColor: DesignColors.borderFaint,
    borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  search: {
    fontSize: 13, fontWeight: '600', color: DesignColors.onSurface, fontFamily,
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: DesignColors.borderSoft,
  },
  loader: { paddingVertical: 16 },
  options: { paddingBottom: 4 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 14,
  },
  optionSelected: { backgroundColor: DesignColors.primaryTint },
  optionTextWrap: { flex: 1, paddingRight: 8 },
  optionLabel: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  optionLabelSelected: { color: DesignColors.primary },
  optionMeta: { fontSize: 11, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2, opacity: 0.6 },
  empty: {
    paddingVertical: 16, textAlign: 'center',
    fontSize: 13, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.5,
  },
});
