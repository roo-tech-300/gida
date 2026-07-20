import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { MetaPill } from '@/components/admin/inventory-card';
import { LANDLORDS, type Landlord, type LandlordProperty } from '@/dummy/admin-mock';

export function LandlordPropertiesScreen({ landlordId }: { landlordId: string }) {
  const landlord = LANDLORDS.find((l) => l.id === landlordId);

  if (!landlord) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <BackButton hasBackground />
          <Text style={styles.headerTitle}>Landlord not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <BackButton hasBackground />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{landlord.full_name}</Text>
          <Text style={styles.headerSub}>{landlord.properties_onboarded} Properties</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {landlord.properties.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.emptyText}>No properties</Text>
            <Text style={styles.emptySub}>This landlord hasn't onboarded any properties yet</Text>
          </View>
        ) : (
          landlord.properties.map((property) => (
            <LandlordPropertyCard key={property.id} property={property} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LandlordPropertyCard({ property }: { property: LandlordProperty }) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={property.image} style={styles.image} contentFit="cover" />
        <View style={styles.overlay} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{property.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.location}>{property.location}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <MetaPill icon="bed-outline" label={property.beds} />
          <MetaPill icon="water-outline" label={property.baths} />
          <MetaPill icon="square-outline" label={property.size} />
        </View>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Per Academic Year</Text>
            <Text style={styles.price}>{property.price}</Text>
          </View>
          <Pressable style={styles.viewButton} onPress={() => router.push(`/admin/property-contracts/${property.id}` as any)}>
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerInfo: { gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  headerSub: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.7 },

  content: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingBottom: DesignSpacing.xl * 5,
    gap: DesignSpacing.lg,
  },

  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  imageWrap: {
    height: 256,
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  badge: {
    position: 'absolute',
    left: DesignSpacing.md,
    bottom: DesignSpacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(54, 71, 54, 0.92)',
    zIndex: 2,
  },
  badgeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 1,
  },

  body: {
    gap: DesignSpacing.md,
    padding: DesignSpacing.lg,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  titleBlock: { gap: 6 },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
    paddingVertical: DesignSpacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignSpacing.md,
  },
  priceLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  price: {
    ...DesignTypography.headlineMd,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '800',
  },
  viewButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: DesignRadius.xl,
    backgroundColor: DesignColors.primaryContainer,
  },
  viewButtonText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
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
