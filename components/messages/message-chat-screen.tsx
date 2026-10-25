import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { MessageAttachmentSheet } from '@/components/messages/message-attachment-sheet';
import { MessageActionsSheet } from '@/components/messages/message-actions-sheet';
import { MessageChatHeader } from '@/components/messages/message-chat-header';
import { MessageChatList } from '@/components/messages/message-chat-list';
import { useMessageSync } from '@/components/messages/message-sync-provider';
import { MessageComposer } from '@/components/messages/message-composer';
import { ListingPickerModal, type PickerSource } from '@/components/messages/listing-picker-modal';
import { NotificationPermissionPromptModal } from '@/components/notifications/notification-permission-prompt-modal';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useConversationThread } from '@/hooks/use-conversation-thread';
import { useContextualNotificationPrompt } from '@/hooks/use-contextual-notification-prompt';
import { useInitialChatAttachment } from '@/hooks/use-initial-chat-attachment';
import type { ChatMessage, ListingAttachment, MessageReply } from '@/types/messages';
import { copyTextToClipboard } from '@/utils/clipboard';

export function MessageChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const otherId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { showToast } = useAppToast();
  const { profile } = useAuth();
  const myId = profile?.id;
  const { flushOutbox } = useMessageSync();

  const [draft, setDraft] = useState('');
  // undefined = follow the Enquire seed; null/attachment = user has chosen (or removed).
  const [attachmentOverride, setAttachmentOverride] = useState<ListingAttachment | null | undefined>(undefined);
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const [pickerSource, setPickerSource] = useState<PickerSource | null>(null);
  // Long-pressed message (drives the actions sheet) and the message being replied to.
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [replyTarget, setReplyTarget] = useState<MessageReply | null>(null);

  // Seeded when arriving via the listing "Enquire" button (?attachListingId=...).
  // Resolved from the shared ['listing', id] cache — no extra fetch in practice.
  const seededAttachment = useInitialChatAttachment();
  const attachment = attachmentOverride === undefined ? seededAttachment : attachmentOverride;

  const { modalVisible, triggerPromptIfAppropriate, closeModal } =
    useContextualNotificationPrompt('first_sent_message');

  const {
    participant,
    messages,
    unreadBoundaryId,
    isConversationLoading,
    isConversationError,
    isMessagesLoading,
    isMessagesFetching,
    sendMessage,
    isSending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useConversationThread(otherId ?? '');

  useEffect(() => {
    if (isConversationError) {
      showToast({ message: 'This conversation could not be opened. Please try again.', type: 'error' });
    }
  }, [isConversationError, showToast]);

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && !attachment) || isSending) return;
    try {
      await sendMessage({ body: text, attachment, replyTo: replyTarget });
      setDraft('');
      setAttachmentOverride(null);
      setReplyTarget(null);
      triggerPromptIfAppropriate();
    } catch (error) {
      console.error('[MessageChat] Failed to send message:', error);
      showToast({ message: 'Message could not be sent. Please try again.', type: 'error' });
    }
  };

  const handleLongPressMessage = (message: ChatMessage) => {
    setActionMessage(message);
  };

  const handleReplyAction = () => {
    if (!actionMessage) return;
    setReplyTarget({
      messageId: actionMessage.id,
      senderId: actionMessage.senderId,
      body: actionMessage.body,
    });
    setActionMessage(null);
  };

  const handleCopyAction = async () => {
    const target = actionMessage;
    setActionMessage(null);
    if (!target) return;
    const text = target.body.trim();
    if (!text) {
      showToast({ message: 'This message has no text to copy.', type: 'info' });
      return;
    }
    const copied = await copyTextToClipboard(text);
    showToast({
      message: copied ? 'Message copied to clipboard.' : 'Could not copy message.',
      type: copied ? 'success' : 'error',
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/messages');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <SafeKeyboardView style={styles.flex}>
        <MessageChatHeader
          name={participant?.name}
          avatarUrl={participant?.avatarUrl}
          isAdmin={participant?.isAdmin}
          onBack={handleBack}
        />

        {isConversationLoading || (messages.length === 0 && (isMessagesLoading || isMessagesFetching)) ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={DesignColors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.empty}>
              <Ionicons name="hand-left-outline" size={34} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyHint}>Say hello below to break the ice.</Text>
            </View>
          </View>
        ) : (
          <MessageChatList
            messages={messages}
            unreadBoundaryId={unreadBoundaryId}
            myId={myId}
            participantName={participant?.name}
            participantAvatar={participant?.avatarUrl}
            onRetry={() => {
              void flushOutbox();
              showToast({ message: 'Retrying queued message…', type: 'info' });
            }}
            onLongPressMessage={handleLongPressMessage}
            onLoadEarlier={() => {
              if (hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
              }
            }}
            isLoadingEarlier={isFetchingNextPage}
          />
        )}

        <MessageComposer
          draft={draft}
          onDraftChange={setDraft}
          onSend={() => void handleSend()}
          onOpenAttachments={() => setAttachSheetVisible(true)}
          attachment={attachment}
          onClearAttachment={attachment ? () => setAttachmentOverride(null) : undefined}
          replyTo={replyTarget}
          replyToName={replyTarget && replyTarget.senderId === myId ? 'yourself' : participant?.name}
          onClearReply={() => setReplyTarget(null)}
        />
      </SafeKeyboardView>

      <MessageActionsSheet
        visible={actionMessage !== null}
        onClose={() => setActionMessage(null)}
        onReply={handleReplyAction}
        onCopy={() => void handleCopyAction()}
        canCopy={Boolean(actionMessage?.body.trim())}
      />

      <MessageAttachmentSheet
        visible={attachSheetVisible}
        onClose={() => setAttachSheetVisible(false)}
        onSelectSource={(source) => {
          setAttachSheetVisible(false);
          setPickerSource(source);
        }}
        isAdmin={Boolean(profile?.is_admin)}
      />

      <ListingPickerModal
        visible={pickerSource !== null}
        source={pickerSource ?? 'saved'}
        onClose={() => setPickerSource(null)}
        onSelect={(selected) => {
          setAttachmentOverride(selected);
          showToast({ message: `Listing attached: ${selected.title}`, type: 'success' });
        }}
      />

      <NotificationPermissionPromptModal
        visible={modalVisible}
        title="Stay updated on replies"
        description={`Turn on notifications so you know right away when ${participant?.name ?? 'they'} reply.`}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: DesignSpacing.xl,
  },
  empty: {
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingTop: DesignSpacing.xl,
  },
  emptyTitle: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  emptyHint: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
});