import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { MessageThreadFilters } from '@/components/messages/message-thread-filters';
import { MessageThreadList } from '@/components/messages/message-thread-list';
import { NotificationEnableBanner } from '@/components/messages/notification-enable-banner';
import { AppBottomNav } from '@/components/navigation/app-bottom-nav';
import { ScreenTitle } from '@/components/ui/screen-title';
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
      <ScreenTitle title="Messages" />

      <View style={styles.filters}>
        <MessageThreadFilters filters={MESSAGE_FILTERS} activeFilter={filter} onFilterChange={(value) => setFilter(value as MessageFilter)} />
      </View>

      <NotificationEnableBanner />

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
            contentContainerStyle={styles.emptyScroll}
            alwaysBounceVertical
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => handleRefresh()} tintColor={DesignColors.primary} />}
          >
            <View style={styles.emptyCenter}>
              <View style={styles.iconArea}>
                <View style={styles.bubbleContainer}>
                  <View style={[styles.bubble, styles.bubbleLarge]}>
                    <Ionicons name="chatbubble-ellipses" size={28} color={DesignColors.primary} />
                  </View>
                  <View style={[styles.bubble, styles.bubbleSmall]}>
                    <Ionicons name="chatbubbles" size={18} color={DesignColors.secondary} />
                  </View>
                </View>
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyHint}>
                Find a roommate or property and tap “Say Hello” to start chatting.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)')}
                style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
                accessibilityRole="button"
              >
                <Text style={styles.ctaLabel}>Discover Roommates</Text>
                <Ionicons name="arrow-forward" size={18} color={DesignColors.onPrimary} />
              </Pressable>
            </View>
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

      <AppBottomNav activeTab="messages" />
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
  emptyScroll: {
    flexGrow: 1,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignSpacing.marginMobile,
    gap: DesignSpacing.md,
  },
  iconArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.sm,
  },
  bubbleContainer: {
    width: 144,
    height: 144,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
  },
  bubbleLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    zIndex: 1,
  },
  bubbleSmall: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    bottom: 10,
    right: 16,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderColor: DesignColors.borderSoft,
    zIndex: 2,
    transform: [{ rotate: '-8deg' }],
  },
  emptyTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyHint: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: DesignColors.primary,
    marginTop: DesignSpacing.sm,
  },
  ctaButtonPressed: {
    opacity: 0.9,
  },
  ctaLabel: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
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