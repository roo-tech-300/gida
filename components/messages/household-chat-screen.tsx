import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { HouseholdBubble } from '@/components/messages/household-bubble';
import { MessageComposer } from '@/components/messages/message-composer';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useHouseholdThread } from '@/hooks/use-household-thread';
import { HOUSEHOLD_MESSAGE_MAX_LENGTH } from '@/types/household-chat';
import { householdTitle, memberNameMap, memberSummary } from '@/utils/household-chat';

export function HouseholdChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ podId?: string | string[] }>();
  const podId = (Array.isArray(params.podId) ? params.podId[0] : params.podId) ?? '';
  const { showToast } = useAppToast();
  const [draft, setDraft] = useState('');
  const thread = useHouseholdThread(podId);
  const { chat, myId, messages } = thread;

  const names = chat ? memberNameMap(chat) : {};
  const myName = myId ? names[myId] : null;

  const handleBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/messages'));

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || thread.isSending) return;
    try {
      await thread.sendMessage(text);
      setDraft('');
    } catch (error) {
      console.error('[HouseholdChat] Send failed:', error);
      showToast({ message: 'Message could not be sent. Please try again.', type: 'error' });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <SafeKeyboardView style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={DesignColors.onSurface} />
          </Pressable>
          <View style={styles.badge}>
            <Ionicons name="people" size={22} color={DesignColors.onPrimary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>{chat ? householdTitle(chat) : 'Household'}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {chat ? `You, ${memberSummary(chat.memberNames, myName)}` : 'Loading…'}
            </Text>
          </View>
        </View>

        {thread.isLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={DesignColors.primary} /></View>
        ) : thread.isError || (!chat && !thread.isLoading) ? (
          <View style={styles.center} testID="household-error">
            <Ionicons name="cloud-offline-outline" size={36} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>This chat is not available</Text>
            <Text style={styles.emptyHint}>Household chats open once two people are in the group.</Text>
            <Pressable onPress={() => void thread.refetch()} style={styles.retry} accessibilityRole="button">
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={36} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>Say hi to your housemates</Text>
            <Text style={styles.emptyHint}>Sort out who brings what, move-in day and anything else about the place. Only the people in this group can see this chat.</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onEndReached={() => thread.hasNextPage && !thread.isFetchingNextPage && void thread.fetchNextPage()}
            onEndReachedThreshold={0.2}
            renderItem={({ item, index }) => {
              // The list is newest-first, so the message "above" in time is the next item.
              const older = messages[index + 1];
              const showName = !older || older.senderId !== item.senderId;
              return <HouseholdBubble message={item} isMe={item.senderId === myId} senderName={showName ? (names[item.senderId] ?? 'Housemate') : null} />;
            }}
          />
        )}

        {chat ? (
          <MessageComposer
            draft={draft}
            onDraftChange={setDraft}
            onSend={() => void handleSend()}
            placeholder="Message your household"
            maxLength={HOUSEHOLD_MESSAGE_MAX_LENGTH}
          />
        ) : null}
      </SafeKeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: DesignColors.borderSoft,
    backgroundColor: DesignColors.surface,
  },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary },
  headerText: { flex: 1 },
  title: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  subtitle: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.xl },
  emptyTitle: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily },
  emptyHint: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center' },
  retry: { marginTop: DesignSpacing.sm, paddingHorizontal: DesignSpacing.lg, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primaryContainer },
  retryLabel: { ...DesignTypography.labelLg, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
  listContent: { paddingHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.sm, paddingBottom: DesignSpacing.md },
});
