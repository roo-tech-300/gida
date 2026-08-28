import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

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
        <Text style={styles.label}>Recent Searches</Text>
        <Pressable onPress={onClear} style={styles.clearBtn} hitSlop={8}>
          <Text style={styles.clearAll}>Clear All</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {terms.map((term) => (
          <Pressable
            key={term}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => onSelect(term)}
          >
            <Ionicons name="time-outline" size={14} color={DesignColors.outline} />
            <Text style={styles.chipText}>{term}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearAll: {
    ...DesignTypography.labelSm,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DesignColors.glassFill,
    borderRadius: DesignRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  chipPressed: {
    opacity: 0.6,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  chipText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
});
