import { useEffect, useMemo, useRef } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    View,
    type ListRenderItemInfo,
} from 'react-native';

import { MessageBubble } from '@/components/messages/message-bubble';
import { UnreadDivider } from '@/components/messages/unread-divider';
import { DesignColors, DesignSpacing } from '@/constants/design';
import type { ChatMessage } from '@/types/messages';

const UNREAD_DIVIDER_KEY = '__unread_divider__';

type MessageChatListProps = {
  messages: readonly ChatMessage[];
  unreadBoundaryId: string | null;
  myId?: string;
  participantName?: string | null;
  participantAvatar?: string | null;
  onRetry: (messageId: string) => void;
  onLoadEarlier?: () => void;
  isLoadingEarlier?: boolean;
};

export function MessageChatList({
  messages,
  unreadBoundaryId,
  myId,
  participantName,
  participantAvatar,
  onRetry,
  onLoadEarlier,
  isLoadingEarlier = false,
}: MessageChatListProps) {
  const listRef = useRef<FlatList<ChatMessage | string> | null>(null);
  const prevLatestMessageIdRef = useRef<string | null>(messages[0]?.id ?? null);

  const listItems = useMemo(() => {
    const items: (string | ChatMessage)[] = [...messages];
    if (!unreadBoundaryId) return items;
    const boundaryIndex = items.findIndex((message) => typeof message !== 'string' && message.id === unreadBoundaryId);
    if (boundaryIndex === -1) return items;
    items.splice(boundaryIndex + 1, 0, UNREAD_DIVIDER_KEY);
    return items;
  }, [messages, unreadBoundaryId]);

  useEffect(() => {
    const latest = messages[0];
    if (latest && latest.id !== prevLatestMessageIdRef.current) {
      prevLatestMessageIdRef.current = latest.id;
      if (latest.senderId === myId) {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    }
  }, [messages, myId]);

  const renderItem = ({ item }: ListRenderItemInfo<string | ChatMessage>) =>
    typeof item === 'string' ? (
      <UnreadDivider />
    ) : (
      <MessageBubble
        message={item}
        avatar={participantAvatar}
        participantName={participantName}
        isMe={item.senderId === myId}
        onRetry={onRetry}
      />
    );

  const renderFooter = () => {
    if (!isLoadingEarlier) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={DesignColors.primary} />
      </View>
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={listItems}
      inverted
      keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      onEndReached={onLoadEarlier}
      onEndReachedThreshold={0.2}
      ListFooterComponent={renderFooter}
      initialNumToRender={15}
      maxToRenderPerBatch={15}
      windowSize={11}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
    paddingBottom: DesignSpacing.md,
  },
  loadingFooter: {
    paddingVertical: DesignSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
