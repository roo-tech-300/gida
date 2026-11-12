import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { formatNaira } from '@/utils/format-naira';
import { spotLabel } from '@/utils/reservation-state';
import type { SlotCredit } from '@/types/liquidity';

const HERO_HEIGHT = 156;

type Props = { credit: SlotCredit; onPress: () => void };

export function MyHomeHero({ credit, onPress }: Props) {
  const photo = credit.estate?.primary_image;
  const name = credit.estate?.name ?? 'Your reserved place';
  const share = credit.amount_paid ? ` · ${formatNaira(credit.amount_paid)} / year` : '';

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${name}`} testID="my-home-hero">
      {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} /> : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]}>
          <Ionicons name="business-outline" size={32} color={DesignColors.primaryBright} />
        </View>
      )}
      <LinearGradient colors={[DesignColors.transparent, DesignColors.scrimDeep]} style={styles.shade} />
      <View style={styles.caption}>
        <Text style={styles.title} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{`${spotLabel(credit)}${share}`}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { height: HERO_HEIGHT, borderRadius: DesignRadius.xl, overflow: 'hidden', backgroundColor: DesignColors.surfaceContainerHigh },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primaryTint },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: HERO_HEIGHT * 0.7 },
  caption: { position: 'absolute', left: DesignSpacing.md, right: DesignSpacing.md, bottom: DesignSpacing.md, gap: 2 },
  title: { ...DesignTypography.titleMd, color: DesignColors.textPrimary, fontFamily, fontWeight: '700' },
  meta: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily, fontWeight: '500' },
});
