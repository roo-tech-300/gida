import { useLocalSearchParams } from 'expo-router';

import { MessageChatScreen } from '@/components/messages/message-chat-screen';
import { conversations } from '@/dummy/messages-mock';

export default function MessageRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversation = conversations.find((c) => c.id === id);

  if (!conversation) return null;

  return <MessageChatScreen conversation={conversation} />;
}
