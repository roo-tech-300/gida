import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type RoommateProfile } from '@/types/roommates';

type Props = {
  roommate: RoommateProfile;
  onViewProfile: (id: string) => void;
  onSayHello: (id: string) => void;
};

function CompatibilityBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? DesignColors.success : pct >= 80 ? DesignColors.primaryFixed : DesignColors.onSurfaceVariant;
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{pct}% Match</Text>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.substring(0, 2).toUpperCase() ?? '?';
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, { backgroundColor: value === 'Yes' || value === 'High' || value === 'Very High' ? DesignColors.secondary : value === 'Low' || value === 'Sometimes' ? DesignColors.primaryBright : DesignColors.onSurfaceVariant }]} />
      <Text style={styles.chipLabel}>{label}: </Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

export function RoommateCard({ roommate, onViewProfile, onSayHello }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarRow}>
          {roommate.avatar ? (
            <Image source={roommate.avatar} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{getInitials(roommate.name)}</Text>
            </View>
          )}
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{roommate.name}, {roommate.age}</Text>
            <Text style={styles.logistics}>Move-in: {roommate.moveInDate} | Budget: {roommate.budget}</Text>
          </View>
        </View>
        <CompatibilityBadge pct={roommate.compatibility} />
      </View>

      <Text style={styles.bio} numberOfLines={2}>"{roommate.bio}"</Text>

      <View style={styles.chipRow}>
        {roommate.chips.map((chip) => (
          <Chip key={chip.label} label={chip.label} value={chip.value} />
        ))}
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={() => onViewProfile(roommate.id)} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>View Profile</Text>
        </Pressable>
        <Pressable onPress={() => onSayHello(roommate.id)} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Say Hello</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.glassFill,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
    gap: DesignSpacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: DesignSpacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '800',
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  logistics: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  badge: {
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily,
  },
  bio: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignColors.borderSoft,
    borderRadius: DesignRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 3,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipLabel: {
    fontSize: 11,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  chipValue: {
    fontSize: 11,
    fontWeight: '700',
    color: DesignColors.onSurface,
    fontFamily,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.borderMedium,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
});
