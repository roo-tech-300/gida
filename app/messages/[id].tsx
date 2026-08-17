import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { MessageChatScreen } from '@/components/messages/message-chat-screen';
import { conversations, type Conversation } from '@/dummy/messages-mock';
import { DesignColors } from '@/constants/design';

export default function MessageRoute() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();

  if (!id) {
    return <View style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }} />;
  }

  const conversation = conversations.find((c) => c.id === id);

  if (conversation) {
    return <MessageChatScreen conversation={conversation} />;
  }

  const fallback: Conversation = {
    id,
    name: typeof name === 'string' && name.trim() ? name : 'New Chat',
    lastMessage: '',
    time: '',
    unreadCount: 0,
    initials: '--',
    image: 0,
    verified: false,
    role: 'Roommate',
  };

  return <MessageChatScreen conversation={fallback} />;
}
