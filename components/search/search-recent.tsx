import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignTypography, fontFamily } from '@/constants/design';

const RECENT_KEY = 'gida_recent_searches';
const MAX_RECENT = 8;

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
    const trimmed = query.trim();
    if (!trimmed) return;
    const recents = getRecents().filter((r) => r !== trimmed);
    recents.unshift(trimmed);
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

export function SearchRecent({ terms, onSelect, onClear }: Props) {
  if (terms.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.label}>Recent</Text>
        <Pressable onPress={onClear}>
          <Text style={styles.clearAll}>Clear</Text>
        </Pressable>
      </View>
      {terms.map((term) => (
        <Pressable key={term} style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]} onPress={() => onSelect(term)}>
          <Ionicons name="time-outline" size={14} color={DesignColors.outline} />
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
    gap: 8,
    backgroundColor: DesignColors.surfaceContainer,
    borderRadius: DesignRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  chipPressed: {
    opacity: 0.6,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  chipText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
