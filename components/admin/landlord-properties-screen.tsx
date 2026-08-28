import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { NetworkErrorScreen } from '@/components/ui/network-error-screen';
import { LandlordProfileModal } from '@/components/admin/landlord-profile-modal';
import { LandlordPropertyCard } from '@/components/admin/landlord-property-card';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { useLandlords } from '@/hooks/use-landlords';
import { useLandlordListings } from '@/hooks/use-landlord-listings';
import { getInitials } from '@/utils/get-initials';
import { useState } from 'react';

export function LandlordPropertiesScreen({ landlordId }: { landlordId: string }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { data: landlords } = useLandlords();
  const { data: listings, isPending, isError, refetch, isRefetching } = useLandlordListings(landlordId);
  const landlord = landlords?.find((l) => l.id === landlordId) ?? null;

  if (isError) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <BackButton hasBackground />
        </View>
        <NetworkErrorScreen onRetry={() => refetch()} subtitle="Could not load this landlord's properties." />
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerSub}>
            {listings ? `${listings.length} Propert${listings.length === 1 ? 'y' : 'ies'}` : 'Loading...'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={DesignColors.primary} />
        }
      >
        {isPending ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={DesignColors.primary} />
          </View>
        ) : !listings || listings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.emptyText}>No properties</Text>
            <Text style={styles.emptySub}>This landlord hasn&apos;t onboarded any properties yet</Text>
          </View>
        ) : (
          listings.map((listing) => <LandlordPropertyCard key={listing.id} property={listing} />)
        )}
      </ScrollView>

      <LandlordProfileModal
        visible={profileOpen && landlord !== null}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },

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
