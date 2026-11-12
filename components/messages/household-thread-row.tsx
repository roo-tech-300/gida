import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import type { HouseholdChat } from '@/types/household-chat';
import { formatRelativeTime } from '@/utils/format-relative-time';
import { householdPreview, householdTitle } from '@/utils/household-chat';

interface Props {
  chat: HouseholdChat;
  myId?: string | null;
  onPress: () => void;
}

export function HouseholdThreadRow({ chat, myId, onPress }: Props) {
  const isUnread = chat.unreadCount > 0;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, isUnread && styles.rowUnread]}
      accessibilityRole="button"
      accessibilityLabel={`${householdTitle(chat)}, ${chat.memberCount} people`}
      testID="household-thread-row"
    >
      <View style={styles.badge}>
        <Ionicons name="people" size={26} color={DesignColors.onPrimary} />
        {isUnread ? <View style={styles.dot} /> : null}
      </View>
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>{householdTitle(chat)}</Text>
          {chat.lastMessageAt ? <Text style={[styles.time, isUnread && styles.timeUnread]}>{formatRelativeTime(chat.lastMessageAt)}</Text> : null}
        </View>
        <Text style={[styles.preview, isUnread && styles.previewUnread]} numberOfLines={1}>{householdPreview(chat, myId)}</Text>
      </View>
      {isUnread ? (
        <View style={styles.count}><Text style={styles.countText}>{chat.unreadCount > 9 ? '9+' : chat.unreadCount}</Text></View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, paddingVertical: 20, paddingHorizontal: DesignSpacing.marginMobile },
  rowUnread: { backgroundColor: DesignColors.primaryTint },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary },
  dot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: DesignColors.primaryFixed, borderWidth: 2, borderColor: DesignColors.surfaceContainerLowest },
  body: { flex: 1, gap: 4 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  name: { flex: 1, fontSize: 17, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  nameUnread: { fontWeight: '800' },
  time: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily },
  timeUnread: { color: DesignColors.primaryFixed, fontWeight: '700' },
  preview: { fontSize: 14, color: DesignColors.onSurfaceVariant, fontFamily },
  previewUnread: { color: DesignColors.onSurface },
  count: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary },
  countText: { fontSize: 12, color: DesignColors.onPrimary, fontFamily, fontWeight: '800' },
});
