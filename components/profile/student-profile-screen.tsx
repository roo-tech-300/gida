import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { studentProfile } from '@/dummy/profile-mock';
import { ProfileRow } from './profile-row';
import { ActiveAdminCard } from './active-admin-card';

export function StudentProfileScreen() {
  const { signOut, profile } = useAuth();
  const p = studentProfile;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1 }}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarBorder}>
                <View style={styles.avatarInner}>
                  <Image source={{ uri: p.avatar }} style={StyleSheet.absoluteFill} />
                </View>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.university}>
              {p.university} • {p.department} • {p.level}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <ProfileRow icon="person-outline" label="Full Name" value={p.name} />
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

          <View style={styles.section}>
              <Pressable style={styles.devButton} onPress={() => router.push('/admin/dev-views')}>
              <Ionicons name="build-outline" size={20} color={DesignColors.primary} />
              <Text style={styles.devButtonText}>Dev: Admin Dashboard</Text>
            </Pressable>
          </View>

          <View style={styles.logoutSection}>
            <Pressable style={styles.logoutRow} onPress={signOut}>
              <Ionicons name="log-out-outline" size={22} color={DesignColors.error} />
              <Text style={styles.logoutText}>Logout Account</Text>
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
  avatarBorder: { width: 96, height: 96, borderRadius: 48, padding: 4, backgroundColor: DesignColors.primary },
  avatarInner: { borderRadius: 44, overflow: 'hidden', borderWidth: 4, borderColor: DesignColors.surfaceContainerLowest },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: DesignColors.primary, borderRadius: 14, padding: 3, borderWidth: 2, borderColor: DesignColors.surfaceContainerLowest },
  name: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily },
  university: { ...DesignTypography.labelCaps, color: DesignColors.secondary, fontFamily, letterSpacing: 1.2 },
  section: { marginHorizontal: DesignSpacing.marginMobile, backgroundColor: DesignColors.glassFill, borderRadius: DesignRadius.xl, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: DesignSpacing.lg },
  sectionTitle: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, paddingHorizontal: DesignSpacing.lg, paddingTop: DesignSpacing.lg, paddingBottom: DesignSpacing.sm },
  completionBadge: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, fontWeight: '700', paddingTop: DesignSpacing.lg, paddingBottom: DesignSpacing.sm },
  devButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm, height: 56, backgroundColor: 'rgba(124, 58, 237, 0.1)', borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.2)' },
  devButtonText: { ...DesignTypography.bodyMd, color: DesignColors.primary, fontFamily, fontWeight: '600' },
  logoutSection: { marginHorizontal: DesignSpacing.marginMobile },
  logoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm, height: 56, borderRadius: DesignRadius.xl, backgroundColor: 'rgba(255, 180, 171, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 180, 171, 0.2)' },
  logoutText: { ...DesignTypography.bodyMd, color: DesignColors.error, fontFamily, fontWeight: '600' },
  version: { ...DesignTypography.labelSm, color: DesignColors.outlineVariant, fontFamily, textAlign: 'center', opacity: 0.4, paddingTop: DesignSpacing.md },
});
