import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, fontFamily } from '@/constants/design';

export type MoveInMode = 'solo' | 'friends' | 'matchmaking';

type Option = {
  mode: MoveInMode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

const OPTIONS: Option[] = [
  { mode: 'solo', icon: 'person-outline', title: 'Solo', description: 'Settle in alone, no matching.' },
  { mode: 'matchmaking', icon: 'sparkles-outline', title: 'Matchmaking', description: 'We pair you with compatible roommates.' },
  { mode: 'friends', icon: 'people-outline', title: 'With Friends', description: 'Reserve together with a shared invite link.' },
];

type Props = {
  mode: MoveInMode;
  onChangeMode: (mode: MoveInMode) => void;
  friendCode: string;
  onChangeFriendCode: (code: string) => void;
};

export function MoveInStyleSelector({ mode, onChangeMode, friendCode, onChangeFriendCode }: Props) {
  return (
    <View style={styles.container} testID="move-in-style-selector">
      {OPTIONS.map((option) => (
        <OptionCard
          key={option.mode}
          option={option}
          selected={mode === option.mode}
          onPress={() => onChangeMode(option.mode)}
        />
      ))}

      {mode === 'friends' && (
        <View style={styles.joinSection}>
          <Text style={styles.inputLabel}>ALREADY HAVE AN INVITE CODE?</Text>
          <TextInput
            testID="friend-code-input"
            style={styles.input}
            placeholder="Enter Code (e.g., GIDA-POD-8291)"
            placeholderTextColor={DesignColors.outline}
            value={friendCode}
            onChangeText={onChangeFriendCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text style={styles.hint}>No code yet? You&apos;ll get one after checkout to share with your friend.</Text>
        </View>
      )}
    </View>
  );
}

function OptionCard({
  option,
  selected,
  onPress,
}: {
  option: Option;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      testID={`mode-${option.mode}`}
    >
      <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
        <Ionicons
          name={option.icon}
          size={18}
          color={selected ? DesignColors.primaryBright : DesignColors.onSurfaceVariant}
        />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{option.title}</Text>
        <Text style={styles.description}>{option.description}</Text>
      </View>
      {selected && (
        <View style={styles.badge} testID={`mode-${option.mode}-badge`}>
          <Ionicons name="checkmark" size={12} color={DesignColors.onPrimary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cardSelected: {
    borderColor: DesignColors.primaryBright,
    backgroundColor: DesignColors.primaryTint,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DesignColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: { backgroundColor: DesignColors.primaryTintMid },
  copy: { flex: 1, paddingRight: 4 },
  title: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: DesignColors.onSurface,
    fontFamily,
  },
  titleSelected: { color: DesignColors.onPrimaryContainer },
  description: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.1,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginTop: 2,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinSection: { gap: 8, marginTop: 2 },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: DesignColors.inputBorder,
    borderRadius: DesignRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: DesignColors.onSurface,
    fontSize: 14,
    fontFamily,
  },
  hint: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 15,
    letterSpacing: 0.1,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
