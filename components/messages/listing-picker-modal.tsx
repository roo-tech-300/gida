import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useSavedListings } from '@/hooks/use-saved-listings';
import { fetchMyAdminListings } from '@/services/listing-service';
import type { ListingAttachment } from '@/types/messages';
import { toListingAttachment } from '@/utils/listing-attachment';

export type PickerSource = 'listings' | 'saved';

const EMPTY_LABELS: Record<PickerSource, string> = {
  listings: 'You have no active listings to share yet.',
  saved: 'No saved listings yet. Tap the heart on any home to save it.',
};

export function ListingPickerModal({
  visible,
  source,
  onClose,
  onSelect,
}: {
  visible: boolean;
  source: PickerSource;
  onClose: () => void;
  onSelect: (attachment: ListingAttachment) => void;
}) {
  const { profile } = useAuth();
  const saved = useSavedListings();
  const myListings = useQuery({
    queryKey: ['my-listings', profile?.id],
    queryFn: () => fetchMyAdminListings(profile!.id),
    enabled: source === 'listings' && !!profile?.id,
  });

  useEscapeKey(onClose, visible);

  const listings = source === 'saved' ? (saved.data ?? []) : (myListings.data ?? []);
  const loading = source === 'saved' ? saved.isLoading : myListings.isLoading;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            {source === 'saved' ? 'Shared from your saved' : 'Share one of your listings'}
          </Text>
          <Text style={styles.subtitle}>Tap a home to attach it to your message.</Text>

          {loading ? (
            <ActivityIndicator style={styles.loading} color={DesignColors.primary} />
          ) : listings.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="albums-outline" size={36} color={DesignColors.onSurfaceVariant} />
              <Text style={styles.emptyText}>{EMPTY_LABELS[source]}</Text>
            </View>
          ) : (
            <FlatList
              data={listings}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const attachment = toListingAttachment(item);
                return (
                  <Pressable
                    style={styles.row}
                    onPress={() => {
                      onSelect(attachment);
                      onClose();
                    }}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbFallback]}>
                        <Ionicons name="home-outline" size={20} color={DesignColors.onSurfaceVariant} />
                      </View>
                    )}
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={styles.rowMeta}>
                        <Ionicons name="location-outline" size={12} color={DesignColors.onSurfaceVariant} />
                        <Text style={styles.rowLocation} numberOfLines={1}>{item.location}</Text>
                      </View>
                      <Text style={styles.rowPrice}>{item.price}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={DesignColors.outlineVariant} />
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: DesignColors.scrim,
  },
  sheet: {
    maxHeight: '74%',
    paddingHorizontal: DesignSpacing.md,
    paddingTop: DesignSpacing.sm,
    paddingBottom: DesignSpacing.xl,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: DesignColors.borderStrong,
    marginBottom: DesignSpacing.md,
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginTop: 4,
    marginBottom: DesignSpacing.md,
  },
  loading: {
    marginVertical: DesignSpacing.xl,
  },
  empty: {
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: DesignSpacing.xl,
  },
  emptyText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    paddingHorizontal: DesignSpacing.lg,
  },
  list: {
    gap: DesignSpacing.sm,
    paddingBottom: DesignSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    padding: DesignSpacing.sm,
    borderRadius: 22,
    backgroundColor: DesignColors.borderFaint,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowLocation: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  rowPrice: {
    ...DesignTypography.labelLg,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
  },
});