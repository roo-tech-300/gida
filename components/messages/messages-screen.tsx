import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { MessageThreadList } from '@/components/messages/message-thread-list';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { conversations, matches } from '@/dummy/messages-mock';

type FilterTab = 'all' | 'roommate' | 'admins';

function MatchAvatar({
  initials,
  verified,
  name,
}: {
  initials: string;
  verified: boolean;
  name: string;
}) {
  return (
    <View style={styles.matchItem}>
      <View style={[styles.matchAvatar, verified && styles.matchAvatarVerified]}>
        <Text style={styles.matchInitials}>{initials}</Text>
        {verified ? (
          <View style={styles.matchVerifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={DesignColors.secondaryContainer} />
          </View>
        ) : null}
      </View>
      <Text style={styles.matchName}>{name}</Text>
    </View>
  );
}

export function MessagesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const visibleThreads = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return conversations;
    return conversations.filter((thread) =>
      `${thread.name} ${thread.lastMessage}`.toLowerCase().includes(term),
    );
  }, [search]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={DesignColors.onSurfaceVariant} />
              <TextInput
                placeholder="Search conversations..."
                placeholderTextColor={DesignColors.onSurfaceVariant}
                style={styles.input}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          <View style={styles.matchesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Matches</Text>
              <Text style={styles.sectionAction}>View All</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.matchesScroll}
            >
              {matches.map((match) => (
                <MatchAvatar
                  key={match.id}
                  initials={match.initials}
                  name={match.name}
                  verified={match.verified}
                />
              ))}
            </ScrollView>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={styles.filterBarContent}
          >
            {(['all', 'roommate', 'admins'] as const).map((tab) => {
              const active = tab === activeFilter;
              const label = tab === 'all' ? 'All' : tab === 'roommate' ? 'Roommate Matches' : 'House Admins';
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveFilter(tab)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <MessageThreadList
            threads={visibleThreads}
            onSelectThread={(id) => router.push(`/messages/${id}`)}
          />
        </ScrollView>

        <DiscoverBottomNav activeTab="messages" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingBottom: DesignSpacing.xl * 3,
  },
  searchWrap: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.md,
    paddingBottom: DesignSpacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    height: 56,
    paddingHorizontal: DesignSpacing.md,
    borderRadius: DesignRadius.xl,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(74, 68, 85, 0.2)',
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    paddingVertical: 0,
  },
  matchesSection: {
    paddingLeft: DesignSpacing.marginMobile,
    marginBottom: DesignSpacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: DesignSpacing.marginMobile,
    marginBottom: DesignSpacing.md,
  },
  sectionTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  sectionAction: {
    ...DesignTypography.labelCaps,
    color: DesignColors.primary,
    fontFamily,
  },
  matchesScroll: {
    gap: DesignSpacing.md,
    paddingRight: DesignSpacing.marginMobile,
  },
  matchItem: {
    alignItems: 'center',
    gap: 8,
  },
  matchAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DesignColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 68, 85, 0.2)',
  },
  matchAvatarVerified: {
    borderColor: DesignColors.primaryContainer,
  },
  matchInitials: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '700',
  },
  matchVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  matchName: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  filterBar: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingBottom: DesignSpacing.md,
  },
  filterBarContent: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(74, 68, 85, 0.2)',
  },
  filterPillActive: {
    backgroundColor: DesignColors.primaryContainer,
    borderColor: DesignColors.primaryContainer,
  },
  filterPillText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  filterPillTextActive: {
    color: DesignColors.onPrimaryContainer,
    fontWeight: '600',
  },
});
