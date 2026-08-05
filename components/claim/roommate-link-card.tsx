import React from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

interface Props {
  intentSize: number;
  isSeparateBilling: boolean;
  onToggleSeparateBilling: (val: boolean) => void;
  friendCode: string;
  onChangeFriendCode: (code: string) => void;
}

export function RoommateLinkCard({
  intentSize,
  isSeparateBilling,
  onToggleSeparateBilling,
  friendCode,
  onChangeFriendCode,
}: Props) {
  const isSingleSlot = intentSize <= 1;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="people-circle-outline" size={22} color={DesignColors.primaryBright} />
        <Text style={styles.title}>Roommate & Separate Billing Options</Text>
      </View>

      <Pressable
        style={[styles.toggleRow, isSingleSlot && styles.toggleDisabled]}
        onPress={() => !isSingleSlot && onToggleSeparateBilling(!isSeparateBilling)}
        disabled={isSingleSlot}
        testID="toggle-separate-billing"
      >
        <Ionicons
          name={!isSingleSlot && isSeparateBilling ? 'checkbox-outline' : 'square-outline'}
          size={22}
          color={!isSingleSlot && isSeparateBilling ? DesignColors.primaryBright : DesignColors.onSurfaceVariant}
        />
        <View style={styles.toggleTextContainer}>
          <View style={styles.badgeWrap}>
            <Text style={styles.toggleLabel}>Bring a Roommate (Separate Billing)</Text>
            {isSingleSlot && <Text style={styles.lockBadge}>REQUIRES 2+ SLOTS</Text>}
          </View>
          <Text style={[styles.toggleDesc, isSingleSlot && styles.warningText]}>
            {isSingleSlot
              ? 'Select 2 or more slots above to bring specific classmates with separate billing.'
              : 'Generate a shareable Pod Code after reservation so your classmate can pay their share independently.'}
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
  card: { backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.md, padding: DesignSpacing.md, borderWidth: 1, borderColor: DesignColors.cardBorder, gap: DesignSpacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  title: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  toggleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: DesignSpacing.sm, marginTop: 4 },
  toggleDisabled: { opacity: 0.45 },
  toggleTextContainer: { flex: 1 },
  badgeWrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  toggleLabel: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  lockBadge: { ...DesignTypography.labelSm, backgroundColor: DesignColors.surfaceContainerLowest, color: DesignColors.error, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: DesignColors.cardBorder },
  toggleDesc: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, marginTop: 2 },
  warningText: { color: DesignColors.error, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: DesignColors.cardBorder, marginVertical: 4 },
  inputLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontSize: 11 },
  input: { backgroundColor: DesignColors.surfaceContainerLowest, borderWidth: 1, borderColor: DesignColors.cardBorder, borderRadius: DesignRadius.sm, paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm, color: DesignColors.onSurface, ...DesignTypography.bodyMd, fontFamily },
});
