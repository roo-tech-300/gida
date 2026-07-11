import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { SearchBar } from '@/components/ui/search-bar';
import { roommateProfiles } from '@/dummy/roommates-mock';
import { type RoommateProfile } from '@/types/roommates';

import { RoommateCard } from './roommate-card';

type SortMode = 'best-match' | 'newest';
type Tag = { key: string; label: string };

const TAGS: Tag[] = [
  { key: 'has-apartment', label: 'Has Apartment' },
  { key: 'looking-room', label: 'Looking for Room' },
  { key: 'pet-friendly', label: 'Pet Friendly' },
  { key: 'non-smoker', label: 'Non-Smoker' },
];

export function RoommateFeed() {
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortMode>('best-match');

  const toggleTag = useCallback((key: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let list = [...roommateProfiles];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.university.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.bio.toLowerCase().includes(q),
      );
    }

    if (activeTags.size > 0) {
      list = list.filter((r) => {
        if (activeTags.has('pet-friendly') && !r.chips.some((c) => c.label === 'Pets' && (c.value === 'Ok' || c.value === 'Yes'))) return false;
        if (activeTags.has('non-smoker') && !r.chips.some((c) => c.label === 'Party' && c.value === 'Never')) return false;
        return true;
      });
    }

    if (sort === 'best-match') {
      list.sort((a, b) => b.compatibility - a.compatibility);
    }

    return list;
  }, [query, activeTags, sort]);

  const renderItem = useCallback(
    ({ item }: { item: RoommateProfile }) => (
      <RoommateCard
        roommate={item}
        onViewProfile={(id) => {}}
        onSayHello={(id) => {}}
      />
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.stickyBar}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search by name, uni, or keyword..." />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
          {TAGS.map((tag) => {
            const active = activeTags.has(tag.key);
            return (
              <Pressable
                key={tag.key}
                onPress={() => toggleTag(tag.key)}
                style={[styles.tag, active && styles.tagActive]}
              >
                <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sortRow}>
          <SortToggle label="Best Match" active={sort === 'best-match'} onPress={() => setSort('best-match')} />
          <SortToggle label="Newest" active={sort === 'newest'} onPress={() => setSort('newest')} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: DesignSpacing.md }} />}
      />
    </View>
  );
}

function SortToggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.sortPill, active && styles.sortPillActive]}>
      <Text style={[styles.sortText, active && styles.sortTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyBar: {
    paddingTop: DesignSpacing.sm,
    paddingBottom: DesignSpacing.md,
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },

  tagRow: {
    gap: DesignSpacing.sm,
    paddingHorizontal: 2,
  },
  tag: {
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagActive: {
    backgroundColor: 'rgba(210,187,255,0.15)',
    borderColor: DesignColors.primary,
  },
  tagText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  tagTextActive: {
    color: DesignColors.primary,
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  sortPill: {
    borderRadius: DesignRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sortPillActive: {
    backgroundColor: 'rgba(210,187,255,0.15)',
  },
  sortText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  sortTextActive: {
    color: DesignColors.primaryBright,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: DesignSpacing.xl * 2,
  },
});
