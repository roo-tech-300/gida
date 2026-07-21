import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useSearchProfiles } from '@/hooks/use-claim';

type Profile = { id: string; full_name: string | null };

type Props = {
  selectedRoommate: Profile | null;
  onSelect: (profile: Profile) => void;
  onClear: () => void;
};

const RECENT_KEY = 'gida_recent_roommate_searches';
const MAX_RECENT = 5;

function getRecents(): string[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(RECENT_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  try {
    const recents = getRecents().filter((r) => r !== query);
    recents.unshift(query);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, MAX_RECENT)));
    }
  } catch {}
}

function clearRecents() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(RECENT_KEY);
  } catch {}
}

export function RoommateSearch({ selectedRoommate, onSelect, onClear }: Props) {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>(getRecents);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const { data: results = [], isLoading } = useSearchProfiles(debouncedQuery);

  const handleSelect = useCallback(
    (profile: Profile) => {
      saveRecent(profile.full_name || 'Unknown');
      setRecents(getRecents());
      setQuery('');
      onSelect(profile);
    },
    [onSelect],
  );

  const handleRemove = useCallback(() => {
    setQuery('');
    onClear();
  }, [onClear]);

  if (selectedRoommate) {
    return (
      <View style={styles.selectedCard}>
        <View style={styles.selectedAvatar}>
          <Ionicons name="person" size={20} color={DesignColors.primaryBright} />
        </View>
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedName}>{selectedRoommate.full_name || 'Unknown'}</Text>
          <Text style={styles.selectedLabel}>Roommate</Text>
        </View>
        <Pressable onPress={handleRemove} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={22} color={DesignColors.error} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} />
        <TextInput
          style={styles.input}
          placeholder="Search roommate by name..."
          placeholderTextColor={DesignColors.onSurfaceVariant}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={DesignColors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      {debouncedQuery.length >= 2 && isLoading && (
        <ActivityIndicator size="small" color={DesignColors.primary} style={styles.loader} />
      )}

      {debouncedQuery.length >= 2 && !isLoading && results.length === 0 && (
        <Text style={styles.noResults}>No users found</Text>
      )}

      {debouncedQuery.length >= 2 && !isLoading && results.length > 0 && (
        <View style={styles.resultsList}>
          {results.map((profile) => (
            <Pressable key={profile.id} style={styles.resultItem} onPress={() => handleSelect(profile)}>
              <View style={styles.resultAvatar}>
                <Ionicons name="person" size={16} color={DesignColors.primaryBright} />
              </View>
              <Text style={styles.resultName}>{profile.full_name || 'Unknown'}</Text>
              <Ionicons name="add-circle-outline" size={20} color={DesignColors.primaryBright} />
            </Pressable>
          ))}
        </View>
      )}

      {debouncedQuery.length < 2 && recents.length > 0 && (
        <View style={styles.recentsSection}>
          <View style={styles.recentsHeader}>
            <Text style={styles.recentsLabel}>Recent searches</Text>
            <Pressable onPress={() => { clearRecents(); setRecents([]); }}>
              <Text style={styles.clearAll}>Clear</Text>
            </Pressable>
          </View>
          {recents.map((term) => (
            <Pressable key={term} style={styles.recentChip} onPress={() => setQuery(term)}>
              <Ionicons name="time-outline" size={14} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.recentText}>{term}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: DesignSpacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.glassFill,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm + 4,
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  loader: {
    paddingVertical: DesignSpacing.sm,
  },
  noResults: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    paddingVertical: DesignSpacing.md,
  },
  resultsList: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.cardBorder,
  },
  resultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultName: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  recentsSection: {
    gap: 6,
  },
  recentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentsLabel: {
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
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: DesignRadius.sm,
    paddingHorizontal: DesignSpacing.sm,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  recentText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.primaryBright,
    padding: DesignSpacing.md,
  },
  selectedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedInfo: {
    flex: 1,
    gap: 2,
  },
  selectedName: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
  selectedLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textTransform: 'uppercase',
  },
  removeBtn: {
    padding: 4,
  },
});
