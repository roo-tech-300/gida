import React from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

interface Props {
  isSeparateBilling: boolean;
  onToggleSeparateBilling: (val: boolean) => void;
  friendCode: string;
  onChangeFriendCode: (code: string) => void;
}

export function RoommateLinkCard({
  isSeparateBilling,
  onToggleSeparateBilling,
  friendCode,
  onChangeFriendCode,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="people-circle-outline" size={22} color={DesignColors.primaryBright} />
        <Text style={styles.title}>Roommate & Separate Billing Options</Text>
      </View>

      <Pressable
        style={styles.toggleRow}
        onPress={() => onToggleSeparateBilling(!isSeparateBilling)}
        testID="toggle-separate-billing"
      >
        <Ionicons
          name={isSeparateBilling ? 'checkbox-outline' : 'square-outline'}
          size={22}
          color={isSeparateBilling ? DesignColors.primaryBright : DesignColors.onSurfaceVariant}
        />
        <View style={styles.toggleTextContainer}>
          <Text style={styles.toggleLabel}>Bring a Roommate (Separate Billing)</Text>
          <Text style={styles.toggleDesc}>
            Generate a shareable Pod Code after reservation so your classmate can pay their share independently.
          </Text>
        </View>
      </Pressable>

      <View style={styles.divider} />

      <Text style={styles.inputLabel}>OR JOIN AN EXISTING ROOMMATE&apos;S POD:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter friend's Pod Code (e.g., GIDA-POD-8291)"
        placeholderTextColor={DesignColors.onSurfaceVariant}
        value={friendCode}
        onChangeText={onChangeFriendCode}
        autoCapitalize="characters"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    gap: DesignSpacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  title: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  toggleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: DesignSpacing.sm, marginTop: 4 },
  toggleTextContainer: { flex: 1 },
  toggleLabel: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  toggleDesc: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, marginTop: 2 },
  divider: { height: 1, backgroundColor: DesignColors.cardBorder, marginVertical: 4 },
  inputLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontSize: 11 },
  input: {
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    borderRadius: DesignRadius.sm,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    color: DesignColors.onSurface,
    ...DesignTypography.bodyMd,
    fontFamily,
  },
});
