import { AppBottomNav } from '@/components/navigation/app-bottom-nav';
import { formatOptionLabel } from '@/components/roommate/roommate-onboarding-options';
import { ReplayTourModal } from '@/components/tour/replay-tour-modal';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useUserSlotCredits } from '@/hooks/use-liquidity';
import { fetchMyRoommatePreferences } from '@/services/roommateProfileService';
import { useNotificationPermission } from '@/src/use-notification-permission-platform';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveAdminCard } from './active-admin-card';
import { ExpiredMarqueeBanner } from './expired-marquee-banner';
import { HelpSupportEntry } from './help-support-entry';
import { JoinGroupCard } from './join-group-card';
import { PendingLodgeInvites } from './pending-lodge-invite-card';
import { ProfileHeader } from './profile-header';
import { ProfileRow } from './profile-row';
import { ReservedHousesSection } from './reserved-houses-section';
import { useAvatarUpload } from './use-avatar-upload';
import { useExpiredLodges } from './use-expired-lodges';
import { useRoommateCompletion } from './use-roommate-completion';

export function StudentProfileScreen() {
  const { signOut, profile, refreshProfile } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [currentTime] = useState(() => Date.now());
  const { showToast } = useAppToast();
  const { status: notificationStatus, enable: enableNotifications } = useNotificationPermission();
  const userId = profile?.id;
  const displayName = profile?.full_name ?? 'Student';

  const { uploading, handleAvatarPress } = useAvatarUpload(userId, refreshProfile, showToast);
  const closeTour = useCallback(() => setTourModalOpen(false), []);
  const openTour = useCallback(() => setTourModalOpen(true), []);

  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['my-roommate-preferences', userId],
    queryFn: () => fetchMyRoommatePreferences(userId ?? ''),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
  const {
    data: reservations,
    isError: reservationsError,
    isPending: reservationsPending,
    isRefetching: reservationsRefetching,
    refetch: refetchReservations,
  } = useUserSlotCredits();

  const expiredLodges = useExpiredLodges(reservations, currentTime);
  const roommateCompletion = useRoommateCompletion(preferences, profile);
  const openReferral = useCallback(() => router.push('/referral-dashboard'), []);


  const roommate = preferences?.roommate;
  const living = preferences?.living;
  const minBudget = living?.min_budget;
  const maxBudget = living?.max_budget;
  const budgetLabel =
    minBudget != null && maxBudget != null
      ? `NGN ${Number(minBudget).toLocaleString('en-US')} - NGN ${Number(maxBudget).toLocaleString('en-US')}/yr`
      : maxBudget != null
        ? `Up to NGN ${Number(maxBudget).toLocaleString('en-US')}/yr`
        : 'Flexible';
  const schoolLabel = profile?.school ?? 'Not set yet';
  const livingArea = formatOptionLabel(living?.preferred_area);
  const livingBits = [budgetLabel === 'Flexible' ? null : budgetLabel, livingArea].filter(Boolean);
  const livingSummary = livingBits.length > 0 ? (livingBits as string[]).join(' | ') : 'Not set yet';
  const habitBits = [
    roommate?.sleep_schedule,
    roommate?.cleanliness_level,
    roommate?.guest_policy,
    roommate?.study_habitat,
    roommate?.personality_vibe,
    roommate?.religion_preference,
  ]
    .map((entry) => formatOptionLabel(entry))
    .filter(Boolean);
  if (roommate?.smoker_allowed) habitBits.push('Smoker OK');
  const roommateSummary =
    habitBits.length > 0 ? (habitBits as string[]).slice(0, 3).join(' | ') : 'Not set yet';

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('[Profile] Logout failed:', error);
      setSigningOut(false);
    }
  };

  const notificationValue =
    notificationStatus === 'granted'
      ? 'On'
      : notificationStatus === 'unavailable'
        ? 'Not available on this device'
        : 'Off';

  const handleNotificationsPress = async () => {
    if (notificationStatus === 'unavailable') {
      showToast({ type: 'info', message: 'Notifications are not available on this device.' });
      return;
    }
    if (notificationStatus === 'granted') {
      showToast({ type: 'info', message: 'Notifications are already on.' });
      return;
    }

    const result = await enableNotifications();
    if (result.enabled) {
      showToast({ type: 'success', message: 'Notifications are on.' });
      return;
    }
    if (result.status === 'denied') {
      showToast({ type: 'info', message: 'Turn on notifications in your device settings.' });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1 }}>
        <ScrollView
          bounces
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={reservationsRefetching}
              onRefresh={() => { void refetchReservations(); }}
              tintColor={DesignColors.primaryBright}
              colors={[DesignColors.primaryBright]}
            />
          }
          showsVerticalScrollIndicator={false}>
          <ProfileHeader
            displayName={displayName}
            schoolLabel={schoolLabel}
            avatarUrl={profile?.avatar_url}
            uploading={uploading}
            onAvatarPress={handleAvatarPress}
          />

          <ExpiredMarqueeBanner expiredLodges={expiredLodges} />

          <JoinGroupCard />
          <PendingLodgeInvites />
          <ReservedHousesSection reservations={reservations ?? []} hasError={reservationsError} isLoading={reservationsPending} />

          <View style={styles.sectionFlat}>
            <Text style={styles.sectionTitleFlat}>Saved</Text>
            <ProfileRow
              icon="heart-outline"
              label="Saved Properties"
              value="Your shortlist"
              onPress={() => router.push('/saved')}
            />
          </View>

          <View style={styles.sectionFlat}>
            <Text style={styles.sectionTitleFlat}>Personal Information</Text>
            <ProfileRow icon="person-outline" label="Full Name" value={profile?.full_name ?? 'Student'} onPress={() => router.push('/personal-info/full-name')} />
            <ProfileRow icon="at-outline" label="Username" value={profile?.username ? `@${profile.username}` : 'Not set yet'} onPress={() => router.push('/personal-info/username')} />
            <ProfileRow icon="mail-outline" label="Email Address" value={profile?.email ?? 'Not available'} onPress={() => router.push('/personal-info/email')} />
            <ProfileRow icon="chatbubble-ellipses-outline" label="Bio" value={profile?.bio ?? 'No bio yet'} onPress={() => router.push('/personal-info/bio')} />
          </View>

          <View style={styles.sectionFlat}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleFlat}>Roommate Profile</Text>
              <Text style={styles.completionBadge}>{preferencesLoading ? 'Loading...' : `${roommateCompletion}% Complete`}</Text>
            </View>
            <ProfileRow icon="home-outline" label="Living Preference" value={livingSummary} onPress={() => router.push('/roommate-living-preferences')} />
            <ProfileRow icon="people-outline" label="Roommate Preference" value={roommateSummary} onPress={() => router.push('/roommate-more-settings')} />
          </View>
          {userId && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Earn</Text>
              <ProfileRow icon="gift-outline" label="Refer & Earn" value="Invite friends, get paid" onPress={openReferral} />
            </View>
          )}

          <View style={styles.sectionFlat}>
            <Text style={styles.sectionTitleFlat}>Account & Safety</Text>
            <ProfileRow
              icon="compass-outline"
              label="App Tour & Guide"
              value="View Features"
              onPress={openTour}
            />
            <ProfileRow
              icon="notifications-outline"
              label="Notifications"
              value={notificationValue}
              onPress={() => void handleNotificationsPress()}
            />
            <ProfileRow icon="shield-checkmark-outline" label="Security & Privacy" />
            <HelpSupportEntry />
          </View>

          {profile?.admin_role ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {profile.admin_role === 'super_admin' ? 'Super Admin Access' : profile.admin_role === 'regional_admin' ? 'Regional Admin Access' : 'Field Admin Access'}
              </Text>
              <ActiveAdminCard role={profile.admin_role} />
            </View>
          ) : null}

          <View style={styles.logoutSection}>
            <Pressable
              style={styles.logoutRow}
              onPress={handleLogout}
              disabled={signingOut}
            >
              {signingOut ? (
                <ActivityIndicator color={DesignColors.error} />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={22} color={DesignColors.error} />
                  <Text style={styles.logoutText}>Logout Account</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>

        <AppBottomNav activeTab="profile" />
        <ReplayTourModal visible={tourModalOpen} onClose={closeTour} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surface,
  },
  content: { paddingTop: DesignSpacing.md, paddingBottom: DesignSpacing.xl, gap: DesignSpacing.xl },
  section: { marginHorizontal: DesignSpacing.marginMobile, gap: DesignSpacing.sm },
  sectionFlat: { marginHorizontal: DesignSpacing.marginMobile, gap: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: DesignSpacing.lg },
  sectionTitle: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, paddingTop: 2, paddingBottom: 2 },
  sectionTitleFlat: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, paddingBottom: DesignSpacing.sm },
  completionBadge: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, fontWeight: '700', paddingTop: DesignSpacing.lg, paddingBottom: DesignSpacing.sm },
  logoutSection: { marginHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.sm },
  logoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm, height: 56, borderRadius: DesignRadius.xl, backgroundColor: DesignColors.dangerContainer },
  logoutText: { ...DesignTypography.bodyMd, color: DesignColors.error, fontFamily, fontWeight: '600' },
  version: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center', opacity: 0.6, paddingTop: DesignSpacing.md },
});