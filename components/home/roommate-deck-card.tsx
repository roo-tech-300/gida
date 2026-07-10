import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { RoommateProfile } from '@/types/roommates';

type Props = {
  profile: RoommateProfile;
  onViewProfile: (id: string) => void;
  onSayHello: (id: string) => void;
};

function getDotColor(value: string): string {
  const v = value.toLowerCase();
  if (v === 'high' || v === 'very high' || v === 'yes' || v === 'ok') return DesignColors.secondary;
  if (v === 'medium') return DesignColors.tertiary;
  return DesignColors.error;
}

function ChipPill({ label, value }: { label: string; value: string }) {
  const dotColor = getDotColor(value);
  return (
    <View style={[styles.chip, { borderColor: `${dotColor}30` }]}>
      <View style={[styles.chipDot, { backgroundColor: dotColor, shadowColor: dotColor }]} />
      <Text style={styles.chipText}>{label}: {value}</Text>
    </View>
  );
}

export function RoommateDeckCard({ profile, onViewProfile, onSayHello }: Props) {
  return (
    <View style={styles.card}>
      <Image source={profile.avatar} style={styles.image} contentFit="cover" />

      <View style={styles.gradientOverlay}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="bottomMask" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="rgba(14,14,16,0)" stopOpacity="0" />
              <Stop offset="40%" stopColor="rgba(14,14,16,0.6)" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="rgba(14,14,16,1)" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bottomMask)" />
        </Svg>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.glassCard}>
          <BlurView intensity={90} tint="dark" style={styles.glassBlur} />
          <View style={styles.glassInner}>
            <Text style={styles.nameText}>{profile.name}, {profile.age}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={DesignColors.onSurfaceVariant} />
                <Text style={styles.metaText}>Move-in: {profile.moveInDate}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={14} color={DesignColors.onSurfaceVariant} />
                <Text style={styles.metaText}>Budget: {profile.budget}</Text>
              </View>
            </View>

            <Text style={styles.bio} numberOfLines={2}>
              "{profile.bio}"
            </Text>

            <View style={styles.chipsRow}>
              {profile.chips.map((chip) => (
                <ChipPill key={chip.label} label={chip.label} value={chip.value} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.viewProfileBtn} onPress={() => onViewProfile(profile.id)}>
            <Text style={styles.viewProfileText}>View Profile</Text>
          </Pressable>
          <Pressable style={styles.sayHelloBtn} onPress={() => onSayHello(profile.id)}>
            <Text style={styles.sayHelloText}>Say Hello</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0e0e10',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: DesignSpacing.md,
    paddingBottom: 20,
    gap: DesignSpacing.sm + 4,
  },
  glassCard: {
    borderRadius: DesignRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(24,24,28,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  glassInner: {
    padding: DesignSpacing.lg,
    gap: DesignSpacing.md,
  },
  nameText: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
  },
  metaText: {
    fontSize: 13,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  bio: {
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: DesignColors.onSurface,
    opacity: 0.9,
    fontFamily,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs + 2,
    paddingHorizontal: DesignSpacing.sm + 4,
    paddingVertical: DesignSpacing.xs + 2,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(24,24,28,0.4)',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
    color: DesignColors.onSurface,
    fontFamily,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  viewProfileBtn: {
    flex: 1,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(24,24,28,0.5)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: DesignColors.onSurface,
    fontFamily,
  },
  sayHelloBtn: {
    flex: 2.4,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryContainer,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: DesignColors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sayHelloText: {
    fontSize: 15,
    fontWeight: '700',
    color: DesignColors.onPrimary,
    fontFamily,
  },
});
