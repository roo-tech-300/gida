import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { RoommateProfile } from '@/types/roommates';

type Props = {
  roommate: RoommateProfile;
  matchScore?: number;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.substring(0, 2).toUpperCase() ?? '?';
}

export function RoommateProfileHeader({ roommate, matchScore }: Props) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {roommate.avatar ? (
        <Image source={roommate.avatar} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]}>
          <Text style={styles.initials}>{getInitials(roommate.name)}</Text>
        </View>
      )}

      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="profileMask" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={DesignColors.surfaceContainerLowest} stopOpacity="0.15" />
              <Stop offset="55%" stopColor={DesignColors.glassSoft} stopOpacity="0.55" />
              <Stop offset="100%" stopColor={DesignColors.surfaceContainerLowest} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#profileMask)" />
        </Svg>
      </View>

      <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={DesignColors.onSurface} />
      </Pressable>

      {matchScore !== undefined && (
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{matchScore}% Match</Text>
        </View>
      )}

      <View style={styles.bottom}>
        <Text style={styles.name}>
          {roommate.name}, {roommate.age}
        </Text>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Ionicons name="school-outline" size={12} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.tagText}>{roommate.university}</Text>
          </View>
          <View style={styles.tagDot} />
          <View style={styles.tag}>
            <Ionicons name="layers-outline" size={12} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.tagText}>{roommate.level}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 360,
    position: 'relative',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  initials: {
    fontSize: 140,
    fontWeight: '700',
    color: DesignColors.primary,
    fontFamily,
    opacity: 0.5,
  },
  backButton: {
    position: 'absolute',
    top: DesignSpacing.md,
    left: DesignSpacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.glassSoft,
    borderWidth: 1,
    borderColor: DesignColors.borderMedium,
  },
  matchBadge: {
    position: 'absolute',
    top: DesignSpacing.md,
    right: DesignSpacing.md,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryTintMid,
    borderWidth: 1,
    borderColor: DesignColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '700',
    color: DesignColors.primaryBright,
    fontFamily,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DesignSpacing.marginMobile,
    gap: DesignSpacing.sm,
  },
  name: {
    ...DesignTypography.headlineLg,
    color: DesignColors.onSurface,
    fontFamily,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DesignColors.glassSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.borderMedium,
  },
  tagText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  tagDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: DesignColors.outlineVariant,
  },
});
