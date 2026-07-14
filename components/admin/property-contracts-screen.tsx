import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { DesignColors, fontFamily } from '@/constants/design';
import { CONTRACTS, LANDLORDS } from '@/dummy/admin-mock';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: 'rgba(74,225,115,0.12)', color: '#4ae176', label: 'Active' },
  expired: { bg: 'rgba(255,180,171,0.12)', color: '#ffb4ab', label: 'Expired' },
  pending_renewal: { bg: 'rgba(255,183,132,0.12)', color: '#ffb784', label: 'Pending Renewal' },
  terminated: { bg: 'rgba(255,180,171,0.12)', color: '#ffb4ab', label: 'Terminated' },
};

export function PropertyContractsScreen({ propertyId }: { propertyId: string }) {
  const property = useMemo(() => {
    for (const l of LANDLORDS) {
      const p = l.properties.find((pr) => pr.id === propertyId);
      if (p) return { ...p, landlord: l.full_name };
    }
    return null;
  }, [propertyId]);

  const contracts = useMemo(
    () => CONTRACTS.filter((c) => c.property_id === propertyId),
    [propertyId],
  );

  if (!property) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <BackButton hasBackground />
          <Text style={styles.headerTitle}>Property not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <BackButton hasBackground />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{property.title}</Text>
          <Text style={styles.headerSub}>{property.landlord} • {contracts.length} Contract{contracts.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.propertyInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.infoText}>{property.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={14} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.infoText}>{property.price}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {contracts.map((contract) => {
            const s = STATUS_STYLES[contract.status];
            return (
              <View key={contract.id} style={styles.contractCard}>
                <View style={styles.contractTop}>
                  <View style={styles.tenantInfo}>
                    <View style={styles.tenantAvatar}>
                      <Text style={styles.tenantInitials}>
                        {contract.tenant_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.tenantName}>{contract.tenant_name}</Text>
                      <Text style={styles.contractType}>{contract.type}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>

                <View style={styles.contractDivider} />

                <View style={styles.contractMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Start Date</Text>
                    <Text style={styles.metaValue}>{contract.start_date}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>End Date</Text>
                    <Text style={styles.metaValue}>{contract.end_date}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Rent</Text>
                    <Text style={[styles.metaValue, { color: DesignColors.primaryBright, fontWeight: '700' }]}>{contract.rent_amount}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerInfo: { gap: 2, flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  headerSub: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.7 },

  content: { paddingHorizontal: 16, paddingBottom: 60, gap: 20 },

  propertyInfo: {
    flexDirection: 'row', gap: 20,
    backgroundColor: DesignColors.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.8 },

  list: { gap: 12 },
  contractCard: {
    borderRadius: 16, padding: 16,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  contractTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  tenantInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  tenantAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  tenantInitials: { fontSize: 13, fontWeight: '700', color: DesignColors.primary, fontFamily },
  tenantName: { fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  contractType: { fontSize: 11, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.7 },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: { fontSize: 11, fontWeight: '700', fontFamily },

  contractDivider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 14,
  },

  contractMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flex: 1, gap: 4 },
  metaLabel: { fontSize: 10, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily, letterSpacing: 0.5, opacity: 0.6 },
  metaValue: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
});
