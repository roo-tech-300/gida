import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { MessageThreadFilters } from '@/components/messages/message-thread-filters';
import { MessageThreadList } from '@/components/messages/message-thread-list';
import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useConversations } from '@/hooks/use-conversations';
import { useMessageSync } from '@/components/messages/message-sync-provider';
import { MESSAGE_FILTERS, type Conversation, type MessageFilter } from '@/types/messages';

export function MessagesScreen() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const [filter, setFilter] = useState<MessageFilter>('All');
  const { data, isLoading, isError, refetch, isRefetching } = useConversations();
  const { flushOutbox } = useMessageSync();

  const handleRefresh = () => {
    void flushOutbox();
    void refetch();
  };

  useEffect(() => {
    if (isError) {
      showToast({ message: 'Could not load your messages. Pull down to retry.', type: 'error' });
    }
  }, [isError, showToast]);

  const threads = data ?? [];
  const filtered = filter === 'Unread' ? threads.filter((t) => t.unreadCount > 0) : threads;

  const handleSelect = (thread: Conversation) => {
    router.push(`/messages/${thread.participant.id}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles.filters}>
        <MessageThreadFilters filters={MESSAGE_FILTERS} activeFilter={filter} onFilterChange={(value) => setFilter(value as MessageFilter)} />
      </View>

      <View style={styles.flex}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={DesignColors.primary} />
          </View>
        ) : isError ? (
          <ScrollView
            contentContainerStyle={styles.center}
            alwaysBounceVertical
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => handleRefresh()} tintColor={DesignColors.primary} />}
          >
            <Ionicons name="cloud-offline-outline" size={40} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>Could not load messages</Text>
            <Text style={styles.emptyHint}>Pull down to try again.</Text>
            <Pressable
              onPress={() => handleRefresh()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
              accessibilityRole="button"
            >
              {isRefetching ? (
                <ActivityIndicator size="small" color={DesignColors.onPrimaryContainer} />
              ) : (
                <Text style={styles.retryLabel}>Try Again</Text>
              )}
            </Pressable>
          </ScrollView>
        ) : filtered.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.center}
            alwaysBounceVertical
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => handleRefresh()} tintColor={DesignColors.primary} />}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyHint}>Tap “Say Hello” on any roommate to start chatting.</Text>
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            alwaysBounceVertical
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => handleRefresh()} tintColor={DesignColors.primary} />}
          >
            <MessageThreadList threads={filtered} onSelectThread={handleSelect} />
          </ScrollView>
        )}
      </View>

      <DiscoverBottomNav activeTab="messages" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.md,
    paddingBottom: DesignSpacing.md,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: DesignColors.onSurface,
    fontFamily,
  },
  filters: {
    paddingHorizontal: DesignSpacing.marginMobile,
    marginBottom: DesignSpacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.xl,
    paddingVertical: DesignSpacing.xl,
  },
  emptyTitle: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
    textAlign: 'center',
  },
  emptyHint: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.xl,
    paddingVertical: DesignSpacing.sm,
    borderRadius: 999,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryLabel: {
    ...DesignTypography.labelLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});