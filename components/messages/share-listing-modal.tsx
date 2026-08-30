import { useMemo, useState } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { useAppToast } from '@/components/ui/toast-card';
import { styles } from '@/components/messages/share-listing-modal.styles';
import { DesignColors } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useConversations } from '@/hooks/use-conversations';
import { sendMessage } from '@/services/messageService';
import { createOutboxMessage } from '@/services/offline-outbox-store';
import { toListingAttachment } from '@/utils/listing-attachment';
import { getInitials } from '@/utils/initials';
import type { FeedListing } from '@/types/feed-listing';
import type { Conversation } from '@/types/messages';

export function ShareListingModal({
  visible,
  listing,
  onClose,
}: {
  visible: boolean;
  listing: FeedListing;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const myId = profile?.id;
  const { isConnected } = useNetInfo();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useAppToast();
  const { data = [], isLoading, isError } = useConversations();
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEscapeKey(onClose, visible);

  const attachment = useMemo(() => toListingAttachment(listing), [listing]);

  const handleShare = async (conversation: Conversation) => {
    if (!myId || sharingId !== null) return;
    setSharingId(conversation.id);
    try {
      const clientSentAt = Date.now();
      if (isConnected === false) {
        createOutboxMessage({
          conversationId: conversation.id,
          otherUserId: conversation.participant.id,
          senderId: myId,
          body: '',
          attachment,
          clientSentAt,
        });
        showToast({ message: `${listing.title} queued — it will send when you're back online.`, type: 'info' });
      } else {
        await sendMessage({ conversationId: conversation.id, senderId: myId, body: '', attachment, clientSentAt });
        queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
        showToast({ message: `${listing.title} shared with ${conversation.participant.name}.`, type: 'success' });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations', myId] });
      onClose();
      router.push(`/messages/${conversation.participant.id}`);
    } catch (error) {
      console.error('[ShareListing] Failed to share listing:', error);
      showToast({ message: 'Could not share this listing. Please try again.', type: 'error' });
    } finally {
      setSharingId(null);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.previewRow}>
            {listing.image ? (
              <Image source={{ uri: listing.image }} style={styles.previewThumb} contentFit="cover" />
            ) : (
              <View style={[styles.previewThumb, styles.previewFallback]}>
                <Ionicons name="home-outline" size={18} color={DesignColors.onSurfaceVariant} />
              </View>
            )}
            <View style={styles.previewBody}>
              <Text style={styles.previewTitle} numberOfLines={1}>{listing.title}</Text>
              <Text style={styles.previewMeta} numberOfLines={1}>{listing.price}</Text>
            </View>
          </View>

          <Text style={styles.title}>Share with a roommate</Text>
          <Text style={styles.subtitle}>Pick a chat — the home will be sent as a shared card.</Text>

          {isLoading ? (
            <ActivityIndicator style={styles.loading} color={DesignColors.primary} />
          ) : data.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={36} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.emptyText}>
                No chats yet.{'\n'}Say Hello to a roommate first, then you can share homes from here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              ListHeaderComponent={
                isError ? <Text style={styles.errorNote}>Could not refresh chats — showing saved ones.</Text> : null
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  disabled={sharingId !== null}
                  onPress={() => void handleShare(item)}
                >
                  {item.participant.avatarUrl ? (
                    <Image source={{ uri: item.participant.avatarUrl }} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitials}>{getInitials(item.participant.name)}</Text>
                    </View>
                  )}
                  <View style={styles.rowBody}>
                    <Text style={styles.rowName} numberOfLines={1}>{item.participant.name}</Text>
                    <Text style={styles.rowPreview} numberOfLines={1}>{item.lastMessage || 'Say hello'}</Text>
                  </View>
                  {sharingId === item.id ? (
                    <ActivityIndicator size="small" color={DesignColors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={DesignColors.outlineVariant} />
                  )}
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}