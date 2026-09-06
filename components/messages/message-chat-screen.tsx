import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { MessageAttachmentSheet, type AttachmentSource } from '@/components/messages/message-attachment-sheet';
import { MessageChatList } from '@/components/messages/message-chat-list';
import { useMessageSync } from '@/components/messages/message-sync-provider';
import { MessageComposer } from '@/components/messages/message-composer';
import { ListingPickerModal, type PickerSource } from '@/components/messages/listing-picker-modal';
import { SafeKeyboardView } from '@/components/ui/safe-keyboard-view';
import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useConversationThread } from '@/hooks/use-conversation-thread';
import type { ListingAttachment } from '@/types/messages';
import { getInitials } from '@/utils/initials';

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

  const {
    participant,
    messages,
    unreadBoundaryId,
    isConversationLoading,
    isConversationError,
    isMessagesLoading,
    isMessagesFetching,
    isRefetching,
    refetchMessages,
    sendMessage,
    isSending,
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
    } catch (error) {
      console.error('[MessageChat] Failed to send message:', error);
      showToast({ message: 'Message could not be sent. Please try again.', type: 'error' });
    }
  };

  const handleSelectSource = (source: AttachmentSource) => {
    setAttachSheetVisible(false);
    setPickerSource(source);
  };

  const handleSelectListing = (selected: ListingAttachment) => {
    setAttachment(selected);
    showToast({ message: `Listing attached: ${selected.title}`, type: 'success' });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Web refresh / deep link onto /messages/[id] leaves no in-app screen to pop.
      router.replace('/(tabs)/messages');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <SafeKeyboardView
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={DesignColors.onSurface} />
          </Pressable>

          <View style={styles.avatarWrap}>
            {participant?.avatarUrl ? (
              <Image source={{ uri: participant.avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{getInitials(participant?.name ?? 'Gida')}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>{participant?.name ?? 'Loading…'}</Text>
            <Text style={styles.subtitle}>Potential roommate • Gida</Text>
          </View>
        </View>

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
            isRefetching={isRefetching}
            onRefresh={() => void refetchMessages()}
            onRetry={() => {
              void flushOutbox();
              showToast({ message: 'Retrying queued message…', type: 'info' });
            }}
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
        onSelectSource={handleSelectSource}
        isAdmin={Boolean(profile?.is_admin)}
      />

      <ListingPickerModal
        visible={pickerSource !== null}
        source={pickerSource ?? 'saved'}
        onClose={() => setPickerSource(null)}
        onSelect={handleSelectListing}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignColors.borderSoft,
    backgroundColor: DesignColors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primary,
  },
  avatarInitials: {
    fontSize: 16,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  name: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  subtitle: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
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