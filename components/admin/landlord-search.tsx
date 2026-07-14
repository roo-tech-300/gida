import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, fontFamily } from '@/constants/design';
import { useLandlords } from '@/hooks/use-landlords';

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

type Props = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function LandlordSearch({ selectedId, onSelect }: Props) {
  const { data: landlords } = useLandlords();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const selected = useMemo(
    () => landlords?.find((l) => l.id === selectedId) ?? null,
    [selectedId, landlords],
  );

  const filtered = useMemo(() => {
    if (!query.trim() || !landlords) return [];
    const q = query.toLowerCase();
    return landlords.filter(
      (l) => l.full_name.toLowerCase().includes(q) || (l.email ?? '').toLowerCase().includes(q),
    );
  }, [query, landlords]);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setShowResults(false);
      setSearching(false);
      onSelect(null);
      return;
    }
    onSelect(null);
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      setSearching(false);
      setShowResults(true);
    }, 800);
  }, [onSelect]);

  const handleSelect = useCallback((id: string) => {
    onSelect(id);
    setShowResults(false);
  }, [onSelect]);

  const displayValue = selected ? selected.full_name : query;

  return (
    <View style={styles.wrap}>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="Search landlord..."
          placeholderTextColor={DesignColors.onSurfaceVariant}
          value={displayValue}
          onChangeText={handleChange}
        />
        {searching && <ActivityIndicator size="small" color={DesignColors.primary} style={styles.spinner} />}
        {!searching && selected && <Ionicons name="checkmark-circle" size={20} color={DesignColors.secondary} style={styles.spinner} />}
      </View>

      {showResults && filtered.length > 0 && (
        <View style={styles.resultsCard}>
          {filtered.slice(0, 5).map((landlord) => (
            <Pressable
              key={landlord.id}
              style={styles.resultRow}
              onPress={() => handleSelect(landlord.id)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(landlord.full_name)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{landlord.full_name}</Text>
                <Text style={styles.email}>{landlord.email ?? ''}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {showResults && filtered.length === 0 && !searching && query.trim() && (
        <Text style={styles.noResults}>No landlords found</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, zIndex: 10 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, paddingHorizontal: 16, height: 48,
    backgroundColor: 'rgba(24,24,28,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: DesignColors.onSurface, fontFamily, paddingVertical: 0 },
  spinner: { marginLeft: 8 },
  resultsCard: {
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: 'rgba(24,24,28,0.95)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(195,192,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: DesignColors.primary, fontFamily },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  email: { fontSize: 11, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.7 },
  noResults: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center', paddingVertical: 8 },
});
