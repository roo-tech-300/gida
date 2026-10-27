import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { PodShelfTile } from '@/components/home/pod-shelf-tile';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { RecommendedPod } from '@/types/pod-recommendation';
import { getPodGrid } from '@/utils/pod-grid';

type Props = {
  pods: readonly RecommendedPod[];
  /** Height of one reel item; the shelf is exactly one screen tall. */
  height: number;
  onOpenPod: (pod: RecommendedPod) => void;
};

function chunkRows<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function footnote(count: number): string {
  return count === 1
    ? '1 group matches your budget and campus.'
    : `${count} groups match your budget and campus.`;
}

/**
 * Full-screen interstitial that surfaces forming pods between listing reels.
 * Sized to the same height as a listing card so the reel's snapping and
 * offset math stay untouched.
 */
export function PodShelfCard({ pods, height, onOpenPod }: Props) {
  const { columns } = getPodGrid(pods.length);
  const rows = useMemo(() => chunkRows(pods, columns), [pods, columns]);

  if (pods.length === 0) return null;

  return (
    <View style={[styles.card, { height }]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="podShelfBase" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={DesignColors.surfaceContainer} stopOpacity="1" />
            <Stop offset="60%" stopColor={DesignColors.surfaceContainerLowest} stopOpacity="1" />
            <Stop offset="100%" stopColor={DesignColors.surfaceContainerLowest} stopOpacity="1" />
          </LinearGradient>
          <RadialGradient id="podShelfGlow" cx="50%" cy="0%" r="85%">
            <Stop offset="0%" stopColor={DesignColors.primary} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={DesignColors.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#podShelfBase)" />
        <Rect width="100%" height="100%" fill="url(#podShelfGlow)" />
      </Svg>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.eyebrowRow}>
            <View style={styles.dot} />
            <Text style={styles.eyebrow}>Groups saving for these lodges</Text>
          </View>
          <Text style={styles.title}>Looking for a roomate?</Text>
          <Text style={styles.subtitle}>Join someone that already has a lodge.</Text>
        </View>

        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={`pod-row-${rowIndex}`} style={styles.gridRow}>
              {row.map((pod) => (
                <PodShelfTile
                  key={pod.id}
                  pod={pod}
                  hero={columns === 1}
                  onPress={() => onOpenPod(pod)}
                />
              ))}
              {row.length < columns ? <View style={styles.gridFiller} /> : null}
            </View>
          ))}
        </View>

        <Text style={styles.footnote}>{footnote(pods.length)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  content: {
    flex: 1,
    padding: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.lg,
    gap: DesignSpacing.lg,
  },
  header: {
    gap: DesignSpacing.xs,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DesignColors.primaryBright,
  },
  eyebrow: {
    ...DesignTypography.labelCaps,
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  title: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    color: DesignColors.onSurface,
    fontFamily,
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  grid: {
    flex: 1,
    gap: DesignSpacing.sm,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: DesignSpacing.sm,
  },
  gridFiller: {
    flex: 1,
  },
  footnote: {
    ...DesignTypography.labelSm,
    color: DesignColors.outline,
    fontFamily,
    textAlign: 'center',
  },
});
