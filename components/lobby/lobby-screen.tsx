import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useActivePods, useUserSlotCredits } from '@/hooks/use-liquidity';
import { useAppToast } from '@/components/ui/toast-card';
import { SlotPass } from './slot-pass';
import { PodStatusCard } from './pod-status-card';
import { PeerCard } from './peer-card';
import { MOCK_LOBBY_PEERS, MOCK_PHYSICAL_ROOMS } from '@/dummy/liquidity-mock';

export function LobbyScreen() {
  const { data: credits, refetch: refetchCredits, isError } = useUserSlotCredits();
  const { data: pods, refetch: refetchPods } = useActivePods();
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useAppToast();

  const credit = credits?.[0];
  const activePod = pods?.[0];
  const targetTier = credit?.property_tier ?? 4;
  const room = activePod?.is_finalized ? MOCK_PHYSICAL_ROOMS[0].physical_door_number : null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCredits(), refetchPods()]);
    setTimeout(() => setRefreshing(false), 1300);
  };

  const handleInvite = (_peerId: string) => {
    showToast({ message: `Invite sent! If accepted, your pod will progress towards minting.`, type: 'success' });
  };

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Failed to load matching lobby state.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']} testID="lobby-screen-safe-area">
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DesignColors.primaryBright} />}
      >
        <Text style={styles.screenTitle}>MATCHING LOBBY & MINTING</Text>
        <SlotPass credit={credit} />
        <PodStatusCard pod={activePod} targetTier={targetTier} physicalDoor={room} countdownTimer="23h 48m" />
        <Text style={styles.sectionHeader}>COMPATIBLE PEERS IN LOBBY ({MOCK_LOBBY_PEERS.length})</Text>
        <View style={styles.list}>
          {MOCK_LOBBY_PEERS.map((peer) => (
            <PeerCard key={peer.user_id} peer={peer} onInvite={handleInvite} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DesignColors.surface },
  content: { padding: DesignSpacing.md, gap: DesignSpacing.lg, paddingBottom: 40 },
  screenTitle: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontWeight: '800', fontFamily },
  sectionHeader: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, marginTop: DesignSpacing.sm, fontFamily },
  list: { gap: DesignSpacing.md },
  errorText: { ...DesignTypography.bodyLg, color: DesignColors.error, textAlign: 'center', marginTop: 40 },
});
