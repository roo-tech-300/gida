import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { Avatar } from '@/components/ui/avatar';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { PersonMatch } from '@/hooks/use-people-feed';

const PHOTO_HEIGHT = 112;
const MAX_TAGS = 2;

type Props = {
  match: PersonMatch;
  onOpen: (id: string) => void;
  onSayHi: (id: string) => void;
};

/** "early_bird" → "Early bird". Lifestyle answers are stored as ids. */
function prettify(value: string): string {
  const text = value.replace(/_/g, ' ').trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function PersonCardBase({ match, onOpen, onSayHi }: Props) {
  const { person, matchPercent } = match;
  const photo = person.avatar && typeof person.avatar === 'object' && 'uri' in person.avatar ? person.avatar.uri : null;
  const tags = person.chips.slice(0, MAX_TAGS).map((chip) => prettify(chip.value));
  const firstName = person.name.split(' ')[0];

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => onOpen(person.id)}
        accessibilityRole="button"
        accessibilityLabel={`${person.name}, ${person.level}${matchPercent !== null ? `, ${matchPercent}% match` : ''}`}
        testID={`person-card-${person.id}`}
      >
        <View style={styles.photo}>
          {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : (
            <View style={[StyleSheet.absoluteFill, styles.photoFallback]}>
              <Avatar name={person.name} size={64} />
            </View>
          )}
          {matchPercent !== null ? (
            <View style={styles.match}>
              <Text style={styles.matchText}>{matchPercent}% match</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{person.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>{person.level}</Text>
          <Text style={styles.tags} numberOfLines={1}>{tags.length > 0 ? tags.join(' · ') : 'Lifestyle not set yet'}</Text>
        </View>
      </Pressable>
      <Pressable style={styles.hi} onPress={() => onSayHi(person.id)} accessibilityRole="button" accessibilityLabel={`Say hi to ${firstName}`} testID={`person-hi-${person.id}`}>
        <Text style={styles.hiText}>Say hi</Text>
      </Pressable>
    </View>
  );
}

export const PersonCard = memo(PersonCardBase);

const styles = StyleSheet.create({
  card: {
    flex: 1, maxWidth: '50%', padding: 8, borderRadius: DesignRadius.xl, gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  photo: { height: PHOTO_HEIGHT, borderRadius: DesignRadius.lg, overflow: 'hidden', backgroundColor: DesignColors.surfaceContainerHigh },
  photoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primaryTint },
  match: {
    position: 'absolute', top: 8, left: 8, paddingHorizontal: 9, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.scrimDeep,
  },
  matchText: { ...DesignTypography.labelSm, color: DesignColors.primaryFixed, fontFamily, fontWeight: '800' },
  info: { paddingHorizontal: 4, gap: 2 },
  name: { ...DesignTypography.labelLg, fontSize: 15, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  meta: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  tags: { ...DesignTypography.labelSm, color: DesignColors.onSurface, fontFamily, fontWeight: '600', paddingTop: 2 },
  hi: {
    height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerHigh, borderWidth: 1, borderColor: DesignColors.borderMedium,
  },
  hiText: { ...DesignTypography.labelLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
});
