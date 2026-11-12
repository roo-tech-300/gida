import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { HouseholdMessage } from '@/types/household-chat';
import { formatRelativeTime } from '@/utils/format-relative-time';

interface Props {
  message: HouseholdMessage;
  isMe: boolean;
  /** Shown above housemates' messages; omitted for your own and for consecutive messages. */
  senderName: string | null;
}

export function HouseholdBubble({ message, isMe, senderName }: Props) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={[styles.wrap, isMe && styles.wrapMe]}>
        {!isMe && senderName ? <Text style={styles.sender}>{senderName}</Text> : null}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.text, isMe && styles.textMe]}>{message.body}</Text>
        </View>
        <Text style={styles.time}>{formatRelativeTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: DesignSpacing.md, paddingRight: DesignSpacing.marginMobile },
  rowMe: { flexDirection: 'row-reverse', paddingRight: 0, paddingLeft: DesignSpacing.marginMobile },
  wrap: { maxWidth: '82%', alignItems: 'flex-start' },
  wrapMe: { alignItems: 'flex-end' },
  sender: { ...DesignTypography.labelSm, color: DesignColors.primaryFixed, fontFamily, fontWeight: '700', marginBottom: 3, marginLeft: DesignSpacing.sm },
  bubble: { paddingHorizontal: DesignSpacing.md, paddingVertical: DesignSpacing.sm + 2, borderRadius: DesignRadius.lg },
  bubbleThem: { backgroundColor: DesignColors.surfaceContainerHigh, borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: DesignColors.primaryContainer, borderBottomRightRadius: 4 },
  text: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, lineHeight: 21 },
  textMe: { color: DesignColors.onPrimaryContainer },
  time: { ...DesignTypography.labelSm, color: DesignColors.outlineVariant, fontFamily, marginTop: 4, marginHorizontal: 4 },
});
