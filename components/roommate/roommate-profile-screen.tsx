import { useEffect } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useAppToast } from '@/components/ui/toast-card';
import { useRoommateProfile } from '@/hooks/useRoommateProfile';
import type { LifestyleChip } from '@/types/roommates';

import { RoommateProfileHeader } from './roommate-profile-header';
import { RoommateMatchBreakdown } from './roommate-match-breakdown';
import { RoommateProfileAbout } from './roommate-profile-about';
import { RoommateInfoCard, type InfoItem } from './roommate-info-card';
import { RoommateProfileActions } from './roommate-profile-actions';

const CHIP_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Clean: 'sparkles-outline',
  Sleep: 'moon-outline',
  Guests: 'people-outline',
  Study: 'book-outline',
  Vibe: 'leaf-outline',
  Pets: 'paw-outline',
  Party: 'musical-notes-outline',
  Student: 'school-outline',
};

function buildLifestyleItems(chips: LifestyleChip[]): InfoItem[] {
  return chips.map((chip) => ({
    icon: CHIP_ICONS[chip.label] ?? 'ellipse-outline',
    label: chip.label,
    value: chip.value,
  }));
}

export function RoommateProfileScreen({ roommateId }: { roommateId: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useAppToast();
  const { data, isLoading, isError, refetch, isRefetching } = useRoommateProfile(roommateId, profile?.id);

  useEffect(() => {
    if (isError) {
      showToast({ message: 'This profile could not be loaded. Pull down to retry.', type: 'error' });
    }
  }, [isError, showToast]);

  const handleSayHello = () => {
    if (!data) return;
    const name = encodeURIComponent(data.roommate.name);
    router.push(`/messages/${roommateId}?name=${name}`);
  };

  const handleShare = async () => {
    if (!data) return;
    const { roommate } = data;
    try {
      await Share.share({
        message: `${roommate.name}, ${roommate.age} • ${roommate.university} • ${roommate.budget} — found on Gida.`,
      });
    } catch (error) {
      console.error('[RoommateProfile] Share failed:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DesignColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.errorTitle}>Could not load this profile</Text>
          <Text style={styles.errorHint}>Pull down to refresh or go back and try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { roommate, match } = data;

  const preferenceItems: InfoItem[] = [
    { icon: 'cash-outline', label: 'Budget', value: roommate.budget },
    { icon: 'location-outline', label: 'Preferred Area', value: roommate.preferredArea ?? 'Flexible' },
    { icon: 'calendar-outline', label: 'Move-in', value: roommate.moveInDate },
  ];
  if (roommate.religion) {
    preferenceItems.push({ icon: 'heart-outline', label: 'Faith', value: roommate.religion });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={DesignColors.primary} />
          }>
          <RoommateProfileHeader
            roommate={roommate}
            matchScore={match.isReady ? match.score : undefined}
          />
          <View style={styles.sections}>
            <RoommateProfileAbout bio={roommate.bio} />
            <RoommateMatchBreakdown match={match} />
            <RoommateInfoCard title="Lifestyle" items={buildLifestyleItems(roommate.chips)} />
            <RoommateInfoCard title="Looking For" items={preferenceItems} />
          </View>
        </ScrollView>

        <RoommateProfileActions onSayHello={handleSayHello} onShare={handleShare} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.xl,
  },
  errorTitle: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
    textAlign: 'center',
  },
  errorHint: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
  content: {
    paddingBottom: DesignSpacing.xl,
  },
  sections: {
    padding: DesignSpacing.marginMobile,
    gap: DesignSpacing.md,
  },
});
