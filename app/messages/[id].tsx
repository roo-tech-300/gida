import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { MessageChatScreen } from '@/components/messages/message-chat-screen';
import { conversations } from '@/dummy/messages-mock';
import { DesignColors } from '@/constants/design';

export default function MessageRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversation = conversations.find((c) => c.id === id);

  if (!conversation) {
    return <View style={{ flex: 1, backgroundColor: DesignColors.surfaceContainerLowest }} />;
  }

  return <MessageChatScreen conversation={conversation} />;
}
