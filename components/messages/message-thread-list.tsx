import { StyleSheet, View } from 'react-native';

import { MessageThreadRow } from '@/components/messages/message-thread-row';
import { type Conversation } from '@/dummy/messages-mock';
import { DesignColors } from '@/constants/design';

export function MessageThreadList({
  threads,
  onSelectThread,
}: {
  threads: readonly Conversation[];
  onSelectThread: (id: string) => void;
}) {
  return (
    <View style={styles.list}>
      {threads.map((thread) => (
        <View key={thread.id} style={styles.itemWrap}>
          <MessageThreadRow
            thread={thread}
            onPress={() => onSelectThread(thread.id)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {},
  itemWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignColors.borderSoft,
  },
});
