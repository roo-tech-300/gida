import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hasFilter?: boolean;
  onFilterPress?: () => void;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search...', hasFilter, onFilterPress }: Props) {
  return (
    <View style={styles.bar}>
      <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={DesignColors.onSurfaceVariant}
        returnKeyType="search"
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
      {hasFilter && (
        <Pressable style={styles.filterButton} onPress={onFilterPress}>
          <Ionicons name="options-outline" size={20} color={DesignColors.onSurfaceVariant} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 32,
    backgroundColor: 'rgba(26, 26, 30, 0.45)',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    paddingVertical: 0,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
});
