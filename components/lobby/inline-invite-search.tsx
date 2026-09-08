import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useSearchProfiles } from '@/hooks/use-profile-search';
import { Avatar } from '@/components/ui/avatar';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';

interface Props {
  remainingSlots: number;
  onSelect: (name: string, userId?: string) => void;
}

export function InlineInviteSearch({ remainingSlots, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { data: results = [], isFetching } = useSearchProfiles(debouncedQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectProfile = (name: string, userId: string) => {
    onSelect(name, userId);
    setQuery('');
  };

  const handleInviteRaw = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    onSelect(trimmed);
    setQuery('');
  };

  return (
    <SafeKeyboardView>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionLabel}>ADD ROOMMATE</Text>
        </View>
        <Text style={styles.hint}>{remainingSlots} slot{remainingSlots === 1 ? '' : 's'} remaining</Text>

        <View style={styles.inputRow}>
          <Ionicons name="search-outline" size={16} color={DesignColors.onSurfaceVariant} />
          <TextInput
            style={styles.input}
            placeholder="Search by name..."
            placeholderTextColor={DesignColors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={DesignColors.outline} />
            </Pressable>
          )}
        </View>

        {results.length > 0 && (
          <View style={styles.suggestionList}>
            {results.slice(0, 5).map((item) => (
              <Pressable key={item.id} style={styles.suggestionRow} onPress={() => handleSelectProfile(item.full_name ?? 'Roommate', item.id)}>
                <Avatar imageUrl={item.avatar_url} name={item.full_name} size={30} />
                <View style={styles.suggestionCopy}>
                  <Text style={styles.suggestionName} numberOfLines={1}>{item.full_name}</Text>
                  {item.username ? (
                    <Text style={styles.suggestionUsername} numberOfLines={1}>@{item.username}</Text>
                  ) : null}
                </View>
                <Ionicons name="person-add-outline" size={16} color={DesignColors.primaryBright} />
              </Pressable>
            ))}
          </View>
        )}

        {query.trim().length >= 2 && results.length === 0 && !isFetching && (
          <Pressable style={styles.inviteRawBtn} onPress={handleInviteRaw}>
            <Ionicons name="mail-outline" size={14} color={DesignColors.onPrimaryContainer} />
            <Text style={styles.inviteRawText}>Invite &quot;{query.trim()}&quot; anyway</Text>
          </Pressable>
        )}
      </View>
    </SafeKeyboardView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: DesignSpacing.lg,
    paddingBottom: DesignSpacing.md,
    gap: DesignSpacing.xs,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  sectionBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: DesignColors.primaryBright },
  sectionLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 1.2 },
  hint: { ...DesignTypography.labelSm, color: DesignColors.outline, fontFamily },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    borderRadius: DesignRadius.md,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 10,
  },
  input: { flex: 1, color: DesignColors.onSurface, ...DesignTypography.bodyMd, fontFamily },
  suggestionList: {
    backgroundColor: DesignColors.glassSoft,
    borderRadius: DesignRadius.sm,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.borderFaint,
  },
  suggestionCopy: {
    flex: 1,
    gap: 1,
  },
  suggestionName: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
  suggestionUsername: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  inviteRawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DesignColors.primaryTint,
    borderRadius: DesignRadius.sm,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 10,
  },
  inviteRawText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontWeight: '600', fontFamily },
});
