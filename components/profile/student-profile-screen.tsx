import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/auth-context';
import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { uploadAvatar } from '@/services/profileService';
import { useAppToast } from '@/components/ui/toast-card';
import { studentProfile } from '@/dummy/profile-mock';
import { ProfileRow } from './profile-row';
import { ActiveAdminCard } from './active-admin-card';

function getInitials(fullName: string | null | undefined): string {
  if (!fullName) return 'S';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

export function StudentProfileScreen() {
  const { signOut, profile, refreshProfile } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useAppToast();
  const p = studentProfile;
  const displayName = profile?.full_name ?? 'Student';

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
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
    } catch (error: any) {
      console.error('[Profile] Avatar upload failed:', error);
      showToast({ message: error?.message || 'Failed to upload avatar.', type: 'error' });
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
          <View style={styles.profileHeader}>
            <Pressable style={styles.avatarWrap} onPress={handleAvatarPress} disabled={uploading}>
              <View style={styles.avatarBorder}>
                <View style={styles.avatarInner}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFill} />
                  ) : (
                    <View style={styles.initialsFallback}>
                      {uploading ? (
                        <ActivityIndicator size="large" color={DesignColors.onSurface} />
                      ) : (
                        <Text style={styles.initialsText}>{getInitials(displayName)}</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
              {!uploading && (
                <View style={styles.cameraOverlay}>
                  <Ionicons name="camera" size={14} color={DesignColors.onSurface} />
                </View>
              )}
            </Pressable>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.schoolTags}>
              <View style={styles.schoolTag}>
                <Ionicons name="school-outline" size={12} color={DesignColors.onSurfaceVariant} />
                <Text style={styles.schoolTagText}>{p.university}</Text>
              </View>
              <View style={styles.schoolTagDot} />
              <View style={styles.schoolTag}>
                <Ionicons name="layers-outline" size={12} color={DesignColors.onSurfaceVariant} />
                <Text style={styles.schoolTagText}>{p.level}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <ProfileRow icon="person-outline" label="Full Name" value={profile?.full_name ?? 'Student'} />
            <ProfileRow icon="mail-outline" label="Email Address" value={p.email} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Roommate Profile</Text>
              <Text style={styles.completionBadge}>{p.roommateProfile.completion}% Complete</Text>
            </View>
            <ProfileRow icon="moon-outline" label="Sleep Schedule" value={p.roommateProfile.sleepSchedule} />
            <ProfileRow icon="sparkles-outline" label="Cleanliness Level" value={p.roommateProfile.cleanlinessLevel} />
            <ProfileRow icon="cash-outline" label="Maximum Annual Budget" value={p.roommateProfile.maxBudget} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account & Safety</Text>
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
  profileHeader: { alignItems: 'center', gap: DesignSpacing.sm },
  avatarWrap: { position: 'relative', marginBottom: DesignSpacing.xs },
  avatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 1.5,
    backgroundColor: DesignColors.glassBorder,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 47,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  initialsFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  initialsText: {
    fontSize: 32,
    fontWeight: '700',
    color: DesignColors.onSurface,
    fontFamily,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: 14,
    padding: 5,
    borderWidth: 2,
    borderColor: DesignColors.surface,
  },
  name: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily },
  schoolTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
    marginTop: DesignSpacing.xs,
  },
  schoolTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DesignColors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
  },
  schoolTagText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  schoolTagDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: DesignColors.outlineVariant,
  },
  section: { marginHorizontal: DesignSpacing.marginMobile, backgroundColor: DesignColors.surfaceContainerLow, borderRadius: DesignRadius.xl, borderWidth: 1, borderColor: DesignColors.cardBorder, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: DesignSpacing.lg },
  sectionTitle: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, paddingHorizontal: DesignSpacing.lg, paddingTop: DesignSpacing.lg, paddingBottom: DesignSpacing.sm },
  completionBadge: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, fontWeight: '700', paddingTop: DesignSpacing.lg, paddingBottom: DesignSpacing.sm },
  logoutSection: { marginHorizontal: DesignSpacing.marginMobile },
  logoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm, height: 56, borderRadius: DesignRadius.xl, backgroundColor: DesignColors.dangerContainer, borderWidth: 1, borderColor: DesignColors.dangerContainer },
  logoutText: { ...DesignTypography.bodyMd, color: DesignColors.error, fontFamily, fontWeight: '600' },
  version: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, textAlign: 'center', opacity: 0.6, paddingTop: DesignSpacing.md },
});
