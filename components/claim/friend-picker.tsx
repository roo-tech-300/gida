import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useSearchProfiles } from '@/hooks/use-profile-search';
import { SlotDiagram } from '@/components/claim/slot-diagram';
import { InviteCodeModal } from '@/components/claim/invite-code-modal';

export type SelectedFriend = {
  id: string;
  name: string;
};

type Props = {
  allowed: number;
  selected: SelectedFriend[];
  code: string;
  codeSeats: number;
  matchedCount: number;
  onAdd: (friend: SelectedFriend) => void;
  onRemove: (id: string) => void;
};

export function FriendPicker({ allowed, selected, code, codeSeats, matchedCount, onAdd, onRemove }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const { data: results = [], isLoading } = useSearchProfiles(debouncedQuery);
  const isFull = selected.length >= allowed;

  const handleAdd = useCallback(
    (profile: { id: string; full_name: string | null }) => {
      if (isFull) return;
      onAdd({ id: profile.id, name: profile.full_name || 'Unknown' });
      setQuery('');
    },
    [isFull, onAdd],
  );

  return (
    <View style={styles.container}>
      <SlotDiagram friendsCount={selected.length} codeCount={codeSeats} matchedCount={matchedCount} />
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>FRIENDS ON GIDA</Text>
        <Text style={styles.counter}>
          {selected.length} of {allowed}
        </Text>
      </View>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} />
        <TextInput
          style={styles.input}
          placeholder="Search by name"
          placeholderTextColor={DesignColors.outline}
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
      {codeSeats > 0 && (
        <Pressable style={styles.codeLink} onPress={() => setCodeModalVisible(true)} testID="friend-not-on-gida-btn">
          <Ionicons name="link-outline" size={14} color={DesignColors.primaryBright} />
          <Text style={styles.codeLinkText}>Friend not on Gida?</Text>
        </Pressable>
      )}
      {debouncedQuery.length >= 2 && isLoading && (
        <ActivityIndicator size="small" color={DesignColors.primary} style={styles.loader} />
      )}
      {debouncedQuery.length >= 2 && !isLoading && results.length === 0 && (
        <Text style={styles.noResults}>No students found on Gida</Text>
      )}
      {debouncedQuery.length >= 2 && !isLoading && results.length > 0 && (
        <View style={styles.resultsList}>
          {results.map((profile) => {
            const alreadyAdded = selected.some((friend) => friend.id === profile.id);
            return (
              <Pressable
                key={profile.id}
                style={[styles.resultItem, (alreadyAdded || isFull) && styles.resultItemDisabled]}
                onPress={() => handleAdd(profile)}
                disabled={alreadyAdded || isFull}
              >
                <View style={styles.resultAvatar}>
                  <Ionicons name="person" size={16} color={DesignColors.primaryBright} />
                </View>
                <Text style={styles.resultName}>{profile.full_name || 'Unknown'}</Text>
                <Ionicons
                  name={alreadyAdded ? 'checkmark-circle' : 'add-circle-outline'}
                  size={20}
                  color={alreadyAdded ? DesignColors.primaryBright : DesignColors.onSurfaceVariant}
                />
              </Pressable>
            );
          })}
        </View>
      )}
      {selected.length > 0 && (
        <View style={styles.roster}>
          {selected.map((friend) => (
            <View key={friend.id} style={styles.rosterChip}>
              <View style={styles.rosterAvatar}>
                <Ionicons name="person" size={14} color={DesignColors.primaryBright} />
              </View>
              <Text style={styles.rosterName} numberOfLines={1}>
                {friend.name}
              </Text>
              <Pressable onPress={() => onRemove(friend.id)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={DesignColors.error} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <InviteCodeModal visible={codeModalVisible} code={code} onClose={() => setCodeModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DesignSpacing.sm + 2 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  counter: {
    ...DesignTypography.bodyMd,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.inputBorder,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm + 2,
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  codeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingVertical: 2,
  },
  codeLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.primaryBright,
    fontFamily,
  },
  loader: { paddingVertical: DesignSpacing.sm },
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
  resultItemDisabled: { opacity: 0.45 },
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
  roster: { gap: DesignSpacing.xs + 2 },
  rosterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    borderRadius: DesignRadius.md,
    paddingHorizontal: DesignSpacing.sm + 2,
    paddingVertical: DesignSpacing.sm,
  },
  rosterAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: DesignColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.onPrimaryContainer,
    fontFamily,
  },
});
