import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PaginatedFlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { useLandlords } from '@/hooks/use-landlords';
import { useLandlordListingsPaginated } from '@/hooks/use-landlord-listings-paginated';
import { LandlordPropertyCard } from '@/components/admin/landlord-property-card';
import { getInitials } from '@/utils/get-initials';
import { LandlordProfileModal } from '@/components/admin/landlord-profile-modal';
import { useAppToast } from '@/components/ui/toast-card';

export function LandlordPropertiesScreen({ landlordId }: { landlordId: string }) {
  const router = useRouter();
  const { showToast } = useAppToast();

  // Fetch landlord profile
  const { data: landlords, isLoading: landlordsLoading } = useLandlords();
  const landlord = landlords?.find((l) => l.id === landlordId) ?? null;

  // Fetch paginated listings
  const { data: listings, isLoading: listingsLoading, hasNextPage, fetchNextPage } = useLandlordListingsPaginated(landlordId);
  const combinedLoading = landlordsLoading || listingsLoading;

  useEffect(() => {
    if (combinedLoading) {
      showToast({ message: 'Loading landlord properties...', type: 'info' });
    }
  }, [combinedLoading]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <BackButton hasBackground />
        <Pressable
          style={styles.avatar}
          hitSlop={6}
          onPress={() => setProfileOpen?.(true)}
          disabled={!landlord}
        >
          <Text style={styles.avatarText}>{landlord ? getInitials(landlord.full_name) : '—'}</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{landlord?.full_name ?? 'Landlord'}</Text>
          <Text style={styles.headerSub}>
            {listings ? `${listings.length} Propert${listings.length === 1 ? 'y' : 'ies'}` on landlord's properties} : 'Loading…'}
          </Text>
        </View>
      </View>

      {combinedLoading ? (
        <ActivityIndicator size="large" color={DesignColors.primary} />
      ) : !listings || listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={48} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.emptyText}>No properties</Text>
          <Text style={styles.emptySub}>This landlord hasn't onboarded any properties yet</Text>
        </View>
      ) : (
        <PaginatedFlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LandlordPropertyCard property={item} />}
          onEndReached={fetchNextPage}
          onEndReachedThreshold={0.5}
          ListComponent={<View />}
        />
      )}

      <LandlordProfileModal
        visible={profileOpen ?? false}
        landlord={landlord}
        onClose={() => setProfileOpen?.(false)}
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