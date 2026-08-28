import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { ClaimSplitSummary } from '@/components/claim/claim-split-summary';
import { WizardFooter } from '@/components/claim/wizard-footer';
import type { Pod, PodMember } from '@/types/liquidity';
import type { DbListing } from '@/types/feed-listing';
import { calculateBaseRent, calculatePlatformFee, calculateTotalUserCost, EXPECTED_TOTAL_POD_FEE, derivePropertyTier } from '@/utils/liquidity-math';

const FALLBACK_PRICE = 1200000;

const AVATAR_COLORS = [
  DesignColors.primaryContainer,
  '#E8D5F5',
  '#D5EEF5',
  '#F5E6D5',
  '#D5F5E6',
  '#F5D5E0',
];

function getInitials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name ?? '').slice(0, 2).toUpperCase() || '??';
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name ?? '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

function MemberRow({ member, onPress }: { member: PodMember; onPress: () => void }) {
  const isPending = member.slot_credit_id === 'invitation';
  const displayName = member.profile?.full_name || member.full_name || 'Roommate';
  const avatarUrl = member.profile?.avatar_url || member.avatar_url;
  return (
    <Pressable style={({ pressed }) => [styles.memberRow, pressed && styles.memberRowPressed]} onPress={onPress}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.memberAvatar} />
      ) : (
        <View style={[styles.memberAvatar, { backgroundColor: getAvatarColor(displayName) }]}>
          <Text style={styles.memberInitials}>{getInitials(displayName)}</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.memberMeta}>{isPending ? 'Waiting to join' : 'Already in this group'}</Text>
      </View>
      {isPending ? (
        <View style={styles.pendingChip}>
          <Text style={styles.pendingChipText}>Invited</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={DesignColors.onSurfaceVariant} />
      )}
    </Pressable>
  );
}

type Props = {
  pod: Pod;
  listing: DbListing;
  onOpenProfile: (userIds: string) => void;
  onJoin: () => void;
  joining: boolean;
};

export function OpenPodDetail({ pod, listing, onOpenProfile, onJoin, joining }: Props) {
  const propertyTier = derivePropertyTier(listing.property_tier, listing.max_roommates);
  const priceAmount = listing.price_amount ?? FALLBACK_PRICE;
  const baseRent = calculateBaseRent(priceAmount, pod.target_occupancy);
  const platformFee = calculatePlatformFee(EXPECTED_TOTAL_POD_FEE, pod.target_occupancy);
  const totalCost = calculateTotalUserCost(priceAmount, EXPECTED_TOTAL_POD_FEE, pod.target_occupancy);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>This group looks good</Text>
        <Text style={styles.subtitle}>
          {pod.current_total_intent} of {pod.target_occupancy} people are already in. See who&apos;s joining and take the next seat.
        </Text>

        <View style={styles.memberCard}>
          <Text style={styles.sectionLabel}>WHO&apos;S IN</Text>
          {pod.members.map((member) => (
            <MemberRow
              key={member.user_id}
              member={member}
              onPress={() => onOpenProfile(member.user_id)}
            />
          ))}
        </View>

        <ClaimSplitSummary baseRent={baseRent} platformFee={platformFee} totalCost={totalCost} />
        <Text style={styles.tierNote}>
          This group is for the {propertyTier}-person lodge for ₦{priceAmount.toLocaleString()}/yr.
        </Text>
      </ScrollView>

      <WizardFooter label="Join This Group" icon="link-outline" loading={joining} disabled={false} onPress={onJoin} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: DesignSpacing.md, padding: DesignSpacing.md, paddingBottom: DesignSpacing.lg },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 18, color: DesignColors.onSurfaceVariant, fontFamily },
  memberCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
    gap: 4,
  },
  sectionLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily, marginBottom: 4 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: DesignSpacing.sm,
    borderRadius: DesignRadius.sm,
  },
  memberRowPressed: { backgroundColor: DesignColors.surfaceContainerHigh },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: { fontSize: 13, fontWeight: '700', color: DesignColors.onPrimaryContainer, fontFamily },
  memberInfo: { flex: 1, gap: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  memberMeta: { fontSize: 11, color: DesignColors.onSurfaceVariant, fontFamily },
  pendingChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.warningContainer,
  },
  pendingChipText: { fontSize: 10, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily },
  tierNote: { fontSize: 12, lineHeight: 17, color: DesignColors.outline, fontFamily, paddingHorizontal: 2 },
});
