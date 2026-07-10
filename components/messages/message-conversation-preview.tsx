import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type Conversation } from '@/dummy/messages-mock';

export function MessageConversationPreview({ thread }: { thread?: Conversation }) {
  if (!thread) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.imageWrap}>
          <Image source={thread.image} style={styles.image} contentFit="cover" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{thread.name}</Text>
          <Text style={styles.role}>{thread.role}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.location}>{thread.propertyLocation}</Text>
          </View>
        </View>
      </View>

      <View style={styles.messages}>
        {thread.messages.slice(-3).map((message) => (
          <Bubble key={message.id} message={message.text} sender={message.sender} />
        ))}
      </View>
    </View>
  );
}

function Bubble({ message, sender }: { message: string; sender: 'me' | 'them' }) {
  const isMe = sender === 'me';
  return (
    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
      <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: '#1A1A1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    ...StyleSheet.absoluteFillObject,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    ...DesignTypography.labelSm,
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(124, 58, 237, 0.24)',
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
