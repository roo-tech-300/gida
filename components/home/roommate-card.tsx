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
  const color = pct >= 90 ? '#4AE176' : pct >= 80 ? '#D2BBFF' : '#CCC3D8';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{pct}% Match</Text>
    </View>
  );
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
          <Image source={roommate.avatar} style={styles.avatar} contentFit="cover" />
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
    backgroundColor: 'rgba(26,26,30,0.8)',
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    borderColor: 'rgba(255,255,255,0.12)',
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
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
});
