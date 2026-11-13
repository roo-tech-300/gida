import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors } from '@/constants/design';
import { styles } from './assign-role-screen.styles';

export type DropdownItem = { id: string; label: string; meta?: string };
export type IconName = ComponentProps<typeof Ionicons>['name'];

export type SearchableSelectProps = {
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

export function SearchableSelect(props: SearchableSelectProps) {
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
