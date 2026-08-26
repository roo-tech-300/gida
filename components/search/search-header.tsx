import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type SearchHeaderProps = {
  value: string;
  onChangeText: (text: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  placeholder?: string;
};

export const SearchHeader = forwardRef<TextInput, SearchHeaderProps>(function SearchHeader(
  { value, onChangeText, onCancel, onSubmit, placeholder = 'Search listings, locations...' },
  ref,
) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} />
        <TextInput
          ref={ref}
          placeholder={placeholder}
          placeholderTextColor={DesignColors.outline}
          returnKeyType="search"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} style={styles.clearBtn} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={DesignColors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>
      <Pressable onPress={onCancel} style={styles.cancelBtn} hitSlop={8}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSpacing.md,
    gap: 12,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    minHeight: 56,
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    ...DesignTypography.labelLg,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '600',
  },
});
