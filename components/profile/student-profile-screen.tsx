import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { uploadAvatar } from '@/services/profileService';
import { useAppToast } from '@/components/ui/toast-card';
import { fetchMyRoommatePreferences } from '@/services/roommateProfileService';
import { useUserSlotCredits } from '@/hooks/use-liquidity';
import { ProfileRow } from './profile-row';
import { ActiveAdminCard } from './active-admin-card';
import { JoinGroupCard } from './join-group-card';
import { ReservedHousesSection } from './reserved-houses-section';
import { ProfileHeader } from './profile-header';

export function StudentProfileScreen() {
  const { signOut, profile, refreshProfile } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useAppToast();
  const userId = profile?.id;
  const displayName = profile?.full_name ?? 'Student';

  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['my-roommate-preferences', userId],
    queryFn: () => fetchMyRoommatePreferences(userId ?? ''),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
  const { data: reservations, isError: reservationsError, isPending: reservationsPending } = useUserSlotCredits();

  const roommateCompletion = useMemo(() => {
    const roommate = preferences?.roommate;
    const living = preferences?.living;
    const fields = [
      roommate?.sleep_schedule,
      roommate?.cleanliness_level,
      roommate?.guest_policy,
      roommate?.study_habitat,
      roommate?.personality_vibe,
      living?.min_budget,
      living?.max_budget,
      living?.preferred_area,
      profile?.bio,
      profile?.school,
    ];
    const filled = fields.filter((value) => {
      if (typeof value === 'number') return true;
      return Boolean(value && String(value).trim());
    }).length;
    return Math.round((filled / fields.length) * 100);
  }, [preferences, profile?.bio, profile?.school]);

  const sleepSchedule = preferences?.roommate?.sleep_schedule ?? 'Not set yet';
  const cleanlinessLevel = preferences?.roommate?.cleanliness_level ?? 'Not set yet';
  const minBudget = preferences?.living?.min_budget;
  const maxBudget = preferences?.living?.max_budget;
  const budgetLabel = minBudget && maxBudget
    ? `₦${minBudget.toLocaleString('en-US')} – ₦${maxBudget.toLocaleString('en-US')}/yr`
    : maxBudget
      ? `Up to ₦${maxBudget.toLocaleString('en-US')}/yr`
      : 'Flexible';
  const profileBio = profile?.bio ?? 'No bio yet';
  const schoolLabel = profile?.school ?? 'Not set yet';

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('[Profile] Logout failed:', error);
      setSigningOut(false);
    }
  };

  const handleAvatarPress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({ message: 'Photo access is required to change your avatar.', type: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !profile) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      await uploadAvatar(profile.id, uri);
      await refreshProfile();
      showToast({ message: 'Profile picture updated.', type: 'success' });
    } catch (error) {
      console.error('[Profile] Avatar upload failed:', error);
      showToast({ message: error instanceof Error ? error.message : 'Failed to upload avatar.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1 }}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ProfileHeader
            displayName={displayName}
            schoolLabel={schoolLabel}
            avatarUrl={profile?.avatar_url}
            uploading={uploading}
            onAvatarPress={handleAvatarPress}
          />

          <JoinGroupCard />
          <ReservedHousesSection reservations={reservations ?? []} hasError={reservationsError} isLoading={reservationsPending} />

          <View style={styles.sectionFlat}>
            <Text style={styles.sectionTitleFlat}>Personal Information</Text>
            <ProfileRow icon="person-outline" label="Full Name" value={profile?.full_name ?? 'Student'} />
            <ProfileRow icon="mail-outline" label="Email Address" value={profile?.email ?? 'Not available'} />
          </View>

          <View style={styles.sectionFlat}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleFlat}>Roommate Profile</Text>
              <Text style={styles.completionBadge}>{preferencesLoading ? 'Loading...' : `${roommateCompletion}% Complete`}</Text>
            </View>
            <ProfileRow icon="moon-outline" label="Sleep Schedule" value={sleepSchedule} />
            <ProfileRow icon="sparkles-outline" label="Cleanliness Level" value={cleanlinessLevel} />
            <ProfileRow icon="cash-outline" label="Maximum Annual Budget" value={budgetLabel} />
            <ProfileRow icon="chatbubble-ellipses-outline" label="Bio" value={profileBio} />
          </View>

          <View style={styles.sectionFlat}>
            <Text style={styles.sectionTitleFlat}>Account & Safety</Text>
            <ProfileRow icon="shield-checkmark-outline" label="Security & Privacy" />
            <ProfileRow icon="headset-outline" label="Help & Support" />
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

          <Text style={styles.version}>Gida Campus Edition • v4.2.0</Text>
        </ScrollView>

        <DiscoverBottomNav activeTab="profile" />
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
