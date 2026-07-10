import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type Conversation, chatMessages, conversationTours } from '@/dummy/messages-mock';
import { discoverListings } from '@/dummy/listings-mock';
import { MessageBubble } from './message-bubble';
import { AttachmentSource, MessageAttachmentSheet } from './message-attachment-sheet';
import { MessageComposer } from './message-composer';
import { MessageTourCard } from './message-tour-card';
import { savedProperties } from '@/dummy/saved-properties-mock';
import { useAuth } from '@/context/auth-context';

export function MessageChatScreen({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin ?? false;
  const [draft, setDraft] = useState('');
  const [attachmentSheetVisible, setAttachmentSheetVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<string>();
  const scrollRef = useRef<ScrollView>(null);

  const messages = chatMessages[conversation.id] ?? [];
  const tour = conversationTours[conversation.id];
  const attachmentLabel = useMemo(() => {
    if (!selectedAttachment) return undefined;
    return `Ready to share from ${selectedAttachment}`;
  }, [selectedAttachment]);

  const handleSend = () => {
    if (draft.trim().length === 0) return;
    setDraft('');
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleSelectAttachmentSource = (source: AttachmentSource) => {
    if (source === 'listings') {
      const listing = discoverListings[0];
      if (listing) setSelectedAttachment(`My listing: ${listing.title}`);
    }
    if (source === 'saved') {
      const savedListing = savedProperties[0];
      if (savedListing) setSelectedAttachment(`Saved listing: ${savedListing.title}`);
    }
    if (source === 'photos') {
      setSelectedAttachment('Phone photos');
    }
    setAttachmentSheetVisible(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={DesignColors.onSurface} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{conversation.name}</Text>
            <Text style={styles.headerSub}>FUTMinna • Active now</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.dateSeparator}>Today</Text>

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              avatar={conversation.image}
              isMe={msg.sender === 'me'}
            />
          ))}

          {tour && <MessageTourCard tour={tour} />}
        </ScrollView>

        <View style={styles.composerWrap}>
          <MessageComposer
            draft={draft}
            selectedAttachmentLabel={attachmentLabel}
            onDraftChange={setDraft}
            onSend={handleSend}
            onOpenAttachments={() => setAttachmentSheetVisible(true)}
          />
        </View>
      </KeyboardAvoidingView>
      <MessageAttachmentSheet
        isAdmin={isAdmin}
        visible={attachmentSheetVisible}
        onClose={() => setAttachmentSheetVisible(false)}
        onSelectSource={handleSelectAttachmentSource}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignColors.cardBorder,
    backgroundColor: '#000000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  headerSub: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  scrollContent: {
    padding: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.md,
    paddingBottom: DesignSpacing.xl,
  },
  dateSeparator: {
    ...DesignTypography.labelCaps,
    color: DesignColors.outlineVariant,
    fontFamily,
    textAlign: 'center',
    marginBottom: DesignSpacing.lg,
  },
  composerWrap: {
    paddingTop: DesignSpacing.xs,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
});
