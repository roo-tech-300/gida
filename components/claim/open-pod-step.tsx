import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useOpenPodsForListing } from '@/hooks/use-liquidity';
import { useAppToast } from '@/components/ui/toast-card';
import { OpenPodCard } from '@/components/claim/open-pod-card';
import { OpenPodDetail } from '@/components/claim/open-pod-detail';
import { WizardHeader } from '@/components/claim/wizard-header';
import type { DbListing } from '@/types/feed-listing';
import type { Pod } from '@/types/liquidity';
import { isGenderCompatible, podEffectiveGender } from '@/utils/liquidity-math';

type Props = {
  listing: DbListing;
  myGender?: 'MALE' | 'FEMALE' | null;
  joining: boolean;
  onJoin: (pod: Pod) => void;
  onDecline: () => void;
  onClose: () => void;
};

export function OpenPodStep({ listing, myGender, joining, onJoin, onDecline, onClose }: Props) {
  const router = useRouter();
  const { showToast } = useAppToast();
  const [selected, setSelected] = useState<Pod | null>(null);
  const { data, isLoading } = useOpenPodsForListing(listing.id);

  const compatible = (data ?? []).filter((pod) => isGenderCompatible(podEffectiveGender(pod), myGender));

  useEffect(() => {
    if (!isLoading && compatible.length === 0) {
      onDecline();
    }
  }, [isLoading, compatible.length, onDecline]);

  const openProfile = useCallback(
    (userId: string) => {
      if (userId.startsWith('inv-')) {
        showToast({ message: 'They haven\u2019t joined yet \u2014 they\u2019re still deciding.', type: 'info' });
        return;
      }
      router.push(`/roommate/${userId}`);
    },
    [router, showToast],
  );

  return (
    <View style={styles.flex}>
      <WizardHeader step={2} totalSteps={4} canGoBack onBack={selected ? () => setSelected(null) : onDecline} onClose={onClose} />

      <View style={styles.divider} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
          <Text style={styles.loadingText}>Finding groups for this lodge…</Text>
        </View>
      ) : selected ? (
        <OpenPodDetail
          pod={selected}
          listing={listing}
          onOpenProfile={openProfile}
          onJoin={() => onJoin(selected)}
          joining={joining}
        />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>
            Hey there, {compatible.length} room{compatible.length === 1 ? '' : 's'} are looking for a roommate in this lodge
          </Text>
          <Text style={styles.subtitle}>These groups are already forming. Tap one to see who&apos;s in and take a seat.</Text>

          <View style={styles.list}>
            {compatible.map((pod) => (
              <OpenPodCard key={pod.id} pod={pod} onPress={() => setSelected(pod)} />
            ))}
          </View>

          <Pressable style={styles.decline} onPress={onDecline} hitSlop={8} testID="open-pod-decline">
            <Text style={styles.declineText}>I will not want to join these pods</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: DesignColors.borderFaint },
  scroll: { flex: 1 },
  content: { gap: DesignSpacing.md, padding: DesignSpacing.md, paddingBottom: DesignSpacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.md },
  loadingText: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '800', lineHeight: 26 },
  subtitle: { fontSize: 13, lineHeight: 18, color: DesignColors.onSurfaceVariant, fontFamily },
  list: { gap: DesignSpacing.sm, marginTop: 4 },
  decline: { alignItems: 'center', paddingVertical: DesignSpacing.md },
  declineText: { fontSize: 13, color: DesignColors.primaryBright, fontFamily, textDecorationLine: 'underline' },
});
