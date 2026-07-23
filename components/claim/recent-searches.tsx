import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

const RECENT_KEY = 'gida_recent_roommate_searches';
const MAX_RECENT = 5;

export function getRecents(): string[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(RECENT_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecent(query: string) {
  try {
    const recents = getRecents().filter((r) => r !== query);
    recents.unshift(query);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, MAX_RECENT)));
    }
  } catch {}
}

export function clearRecents() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(RECENT_KEY);
  } catch {}
}

type Props = {
  terms: string[];
  onSelect: (term: string) => void;
  onClear: () => void;
};

export function RecentSearches({ terms, onSelect, onClear }: Props) {
  if (terms.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.label}>Recent searches</Text>
        <Pressable onPress={onClear}>
          <Text style={styles.clearAll}>Clear</Text>
        </Pressable>
      </View>
      {terms.map((term) => (
        <Pressable key={term} style={styles.chip} onPress={() => onSelect(term)}>
          <Ionicons name="time-outline" size={14} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.chipText}>{term}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAll: {
    ...DesignTypography.labelSm,
    color: DesignColors.primaryBright,
    fontFamily,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: DesignRadius.sm,
    paddingHorizontal: DesignSpacing.sm,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  chipText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
