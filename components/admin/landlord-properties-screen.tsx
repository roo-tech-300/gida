import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { useLandlords } from '@/hooks/use-landlords';
import { useLandlordListingsPaginated } from '@/hooks/use-landlord-listings-paginated';
import { LandlordPropertyCard } from '@/components/admin/landlord-property-card';
import { getInitials } from '@/utils/get-initials';
import { LandlordProfileModal } from '@/components/admin/landlord-profile-modal';
import { useAppToast } from '@/components/ui/toast-card';
import { PaginatedFlatList } from '@/components/ui/paginated-flat-list';
import type { LandlordListing } from '@/services/landlord-service';

export function LandlordPropertiesScreen({ landlordId }: { landlordId: string }) {
  const { showToast } = useAppToast();
  const [profileOpen, setProfileOpen] = useState(false);

  // Fetch landlord profile
  const { data: landlords, isLoading: landlordsLoading } = useLandlords();
  const landlord = landlords?.find((l) => l.id === landlordId) ?? null;

  // Fetch paginated listings
  const { data: listings, isLoading: listingsLoading, fetchNextPage } = useLandlordListingsPaginated(landlordId);
  const combinedLoading = landlordsLoading || listingsLoading;

  const listingItems = useMemo(
    () => (listings?.pages ?? []).reduce<LandlordListing[]>((acc, page) => acc.concat(page), []),
    [listings],
  );

  useEffect(() => {
    if (combinedLoading) {
      showToast({ message: 'Loading landlord properties...', type: 'info' });
    }
  }, [combinedLoading]);

  const propertyCountLabel = useMemo(() => {
    const count = listingItems.length;
    if (combinedLoading && count === 0) return 'Loading…';
    return `${count} Propert${count === 1 ? 'y' : 'ies'} on landlord's properties`;
  }, [combinedLoading, listingItems]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <BackButton hasBackground />
        <Pressable
          style={styles.avatar}
          hitSlop={6}
          onPress={() => setProfileOpen(true)}
          disabled={!landlord}
        >
          <Text style={styles.avatarText}>{landlord ? getInitials(landlord.full_name) : '—'}</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{landlord?.full_name ?? 'Landlord'}</Text>
          <Text style={styles.headerSub}>{propertyCountLabel}</Text>
        </View>
      </View>

      {combinedLoading && listingItems.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      ) : listingItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={48} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.emptyText}>No properties</Text>
          <Text style={styles.emptySub}>This landlord hasn't onboarded any properties yet</Text>
        </View>
      ) : (
        <PaginatedFlatList
          data={listingItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LandlordPropertyCard property={item} />}
          onEndReached={fetchNextPage}
          onEndReachedThreshold={0.5}
        />
      )}

      <LandlordProfileModal
        visible={profileOpen}
        landlord={landlord}
        onClose={() => setProfileOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerInfo: { flex: 1, gap: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: DesignColors.primary, fontFamily },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  headerSub: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.7 },

  content: {
    flexGrow: 1,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingBottom: DesignSpacing.xl * 5,
    gap: DesignSpacing.lg,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});