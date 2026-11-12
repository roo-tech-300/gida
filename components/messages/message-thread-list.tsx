import { StyleSheet, Text, View } from 'react-native';

import { HouseholdThreadRow } from '@/components/messages/household-thread-row';
import { MessageThreadRow } from '@/components/messages/message-thread-row';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { HouseholdChat } from '@/types/household-chat';
import { type Conversation } from '@/types/messages';
import type { SplitThreads } from '@/utils/thread-kind';

type Props = {
  threads: SplitThreads;
  households?: readonly HouseholdChat[];
  myId?: string | null;
  onSelectThread: (thread: Conversation) => void;
  onSelectHousehold?: (chat: HouseholdChat) => void;
};

/** Gida Support is pinned above direct chats; labels only appear when both groups exist. */
export function MessageThreadList({ threads, households = [], myId, onSelectThread, onSelectHousehold }: Props) {
  const sections = [households.length, threads.support.length, threads.direct.length].filter((n) => n > 0).length;
  const showLabels = sections > 1;
  return (
    <View>
      {households.length > 0 ? (
        <View>
          {showLabels ? <Text style={styles.label}>YOUR HOUSEHOLD</Text> : null}
          {households.map((chat) => (
            <View key={chat.podId} style={styles.itemWrap}>
              <HouseholdThreadRow chat={chat} myId={myId} onPress={() => onSelectHousehold?.(chat)} />
            </View>
          ))}
        </View>
      ) : null}
      {threads.support.length > 0 ? (
        <Section label={showLabels ? 'GIDA SUPPORT' : null} items={threads.support} isSupport onSelectThread={onSelectThread} />
      ) : null}
      {threads.direct.length > 0 ? (
        <Section label={showLabels ? 'DIRECT' : null} items={threads.direct} onSelectThread={onSelectThread} />
      ) : null}
    </View>
  );
}

function Section({ label, items, isSupport = false, onSelectThread }: { label: string | null; items: Conversation[]; isSupport?: boolean; onSelectThread: (thread: Conversation) => void }) {
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {items.map((thread) => (
        <View key={thread.id} style={styles.itemWrap}>
          <MessageThreadRow thread={thread} isSupport={isSupport} onPress={() => onSelectThread(thread)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily,
    paddingHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.md, paddingBottom: DesignSpacing.xs,
  },
  itemWrap: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: DesignColors.borderSoft },
});
