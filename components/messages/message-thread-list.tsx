import { StyleSheet, Text, View } from 'react-native';

import { MessageThreadRow } from '@/components/messages/message-thread-row';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type Conversation } from '@/types/messages';
import type { SplitThreads } from '@/utils/thread-kind';

type Props = {
  threads: SplitThreads;
  onSelectThread: (thread: Conversation) => void;
};

/** Gida Support is pinned above direct chats; labels only appear when both groups exist. */
export function MessageThreadList({ threads, onSelectThread }: Props) {
  const showLabels = threads.support.length > 0 && threads.direct.length > 0;
  return (
    <View>
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
