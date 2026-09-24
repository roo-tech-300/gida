import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { MessageAttachmentSheet } from '@/components/messages/message-attachment-sheet';
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
import type { ListingAttachment } from '@/types/messages';

export function MessageChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const otherId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { showToast } = useAppToast();
  const { profile } = useAuth();
  const myId = profile?.id;
  const { flushOutbox } = useMessageSync();

  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<ListingAttachment | null>(null);
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const [pickerSource, setPickerSource] = useState<PickerSource | null>(null);

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
      await sendMessage({ body: text, attachment });
      setDraft('');
      setAttachment(null);
      triggerPromptIfAppropriate();
    } catch (error) {
      console.error('[MessageChat] Failed to send message:', error);
      showToast({ message: 'Message could not be sent. Please try again.', type: 'error' });
    }
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
          selectedAttachmentLabel={attachment?.title}
        />
      </SafeKeyboardView>

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
          setAttachment(selected);
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