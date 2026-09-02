import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  type ViewToken,
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
  isRefetching: boolean;
  onRefresh: () => void;
  onRetry: (messageId: string) => void;
};

export function MessageChatList({
  messages,
  unreadBoundaryId,
  myId,
  participantName,
  participantAvatar,
  isRefetching,
  onRefresh,
  onRetry,
}: MessageChatListProps) {
  const listRef = useRef<FlatList<ChatMessage | string> | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const listItems = useMemo(() => {
    const items: (string | ChatMessage)[] = [...messages];
    if (!unreadBoundaryId) return items;
    const boundaryIndex = items.findIndex((message) => message.id === unreadBoundaryId);
    if (boundaryIndex === -1) return items;
    items.splice(boundaryIndex, 0, UNREAD_DIVIDER_KEY);
    return items;
  }, [messages, unreadBoundaryId]);

  const scrollToBottom = () => {
    listRef.current?.scrollToEnd({ animated: false });
  };

  const handleContentSizeChange = () => {
    if (stickToBottom) scrollToBottom();
  };

  const handleViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const last = messages[messages.length - 1];
    setStickToBottom(Boolean(last && viewableItems.some((item) => item.item === last)));
  });

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

  return (
    <FlatList
      ref={listRef}
      data={listItems}
      keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      onContentSizeChange={handleContentSizeChange}
      onScrollToIndexFailed={() => scrollToBottom()}
      onViewableItemsChanged={handleViewableItemsChanged.current}
      viewabilityConfig={{ viewAreaCoveragePercentThreshold: 30 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={DesignColors.primary} />}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.md,
    paddingBottom: DesignSpacing.sm,
  },
});
