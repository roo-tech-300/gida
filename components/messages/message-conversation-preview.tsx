import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type ChatMessage, type Conversation } from '@/types/messages';
import { getInitials } from '@/utils/initials';

export function MessageConversationPreview({
  thread,
  messages,
}: {
  thread: Conversation;
  messages?: readonly ChatMessage[];
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.imageWrap}>
          {thread.participant.avatarUrl ? (
            <Image source={{ uri: thread.participant.avatarUrl }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.imageInitials}>{getInitials(thread.participant.name)}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{thread.participant.name}</Text>
          <Text style={styles.role}>Verified roommate on Gida</Text>
        </View>
      </View>

      {messages?.length ? (
        <View style={styles.messages}>
          {messages.slice(-3).map((message) => (
            <Bubble
              key={message.id}
              text={message.body || 'Shared a listing'}
              isMe={message.senderId === thread.participant.id}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Bubble({ text, isMe }: { text: string; isMe: boolean }) {
  return (
    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
      <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: DesignSpacing.md,
    alignItems: 'center',
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
  },
  imageInitials: {
    fontSize: 24,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  name: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  role: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  messages: {
    gap: 8,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: DesignColors.borderSoft,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: DesignColors.primaryTintStrong,
  },
  bubbleText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: DesignColors.onPrimaryContainer,
  },
});