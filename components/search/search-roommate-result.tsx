import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { RoommateSearchResult } from '@/services/search-service';

type Props = {
  roommate: RoommateSearchResult;
  onPress: (id: string) => void;
};

export function SearchRoommateResult({ roommate, onPress }: Props) {
  const name = roommate.full_name || 'Anonymous';
  const school = roommate.school || '';

  return (
    <Pressable style={styles.card} onPress={() => onPress(roommate.id)}>
      {roommate.avatar_url ? (
        <Image source={{ uri: roommate.avatar_url }} style={styles.avatar} contentFit="cover" cachePolicy="disk" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Ionicons name="person-outline" size={20} color={DesignColors.onSurfaceVariant} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {school ? (
          <View style={styles.schoolRow}>
            <Ionicons name="school-outline" size={12} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.school} numberOfLines={1}>{school}</Text>
          </View>
        ) : null}
        {roommate.bio ? (
          <Text style={styles.bio} numberOfLines={2}>{roommate.bio}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  school: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  bio: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginTop: 2,
  },
});
