import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { fetchAdminListings, type AdminListing } from '@/services/adminService';
import { FeaturedListingCard } from './featured-listing-card';
import { ManagementToolsGrid } from './management-tools-grid';

export function AdminDashboardScreen() {
  const { profile } = useAuth();
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [operatingCity, setOperatingCity] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    fetchAdminListings(profile.id).then((listingsData) => {
      setBusinessName(profile.full_name);
      setOperatingCity(profile.city);
      setListings(listingsData);
      setLoading(false);
    });
  }, [profile?.id]);

  const initials = useCallback((name: string) => {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const featuredListing = listings.find((l) => l.featured) ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <BlurView intensity={20} tint="dark" style={styles.avatarBlur} />
              <Text style={styles.avatarText}>{businessName ? initials(businessName) : '?'}</Text>
            </View>
            <View style={styles.backBtnWrap}>
              <BackButton hasBackground={false} />
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{businessName || 'Admin Dashboard'}</Text>
            <Text style={styles.headerSub}>
              {operatingCity || 'City'} <Text style={styles.dot}>{'  \u2022  '}</Text> Admin
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management Tools</Text>
          <ManagementToolsGrid />
        </View>

        <View style={styles.section}>
          <View style={styles.featuredHeader}>
            <Text style={styles.sectionTitle}>Featured Listing</Text>
            <Pressable>
              <Text style={styles.seeAll}>View All</Text>
            </Pressable>
          </View>
          <FeaturedListingCard listing={featuredListing} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e10' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 32, paddingBottom: 128 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingTop: 24 },
  avatarSection: { position: 'relative' },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 22, overflow: 'hidden',
    backgroundColor: 'rgba(24,24,28,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '6deg' }],
    shadowColor: DesignColors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  avatarBlur: { ...StyleSheet.absoluteFillObject },
  avatarText: { fontSize: 20, fontWeight: '900', color: DesignColors.onSurface, fontFamily, transform: [{ rotate: '-6deg' }] },
  backBtnWrap: { position: 'absolute', top: -24, left: -8, zIndex: 10 },
  headerText: { flex: 1 },
  headerTitle: { ...DesignTypography.headlineMd, fontSize: 24, letterSpacing: -0.24, color: DesignColors.onSurface, fontFamily },
  headerSub: { ...DesignTypography.labelCaps, fontSize: 11, letterSpacing: 0.6, color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2 },
  dot: { color: DesignColors.onSurfaceVariant },
  section: { gap: 16 },
  sectionTitle: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, paddingHorizontal: 2 },
  featuredHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  seeAll: { ...DesignTypography.labelSm, fontWeight: '600', color: DesignColors.primary, fontFamily },
});
