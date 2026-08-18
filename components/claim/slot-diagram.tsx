import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type DotKind = 'you' | 'friend' | 'code' | 'matched';

type Props = {
  friendsCount: number;
  codeCount: number;
  matchedCount: number;
};

export function SlotDiagram({ friendsCount, codeCount, matchedCount }: Props) {
  const dots: DotKind[] = [
    'you',
    ...Array.from({ length: friendsCount }, () => 'friend' as const),
    ...Array.from({ length: codeCount }, () => 'code' as const),
    ...Array.from({ length: matchedCount }, () => 'matched' as const),
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {dots.map((kind, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              kind === 'you' && styles.youDot,
              kind === 'friend' && styles.friendDot,
              kind === 'code' && styles.codeDot,
              kind === 'matched' && styles.matchedDot,
            ]}
          >
            {kind === 'you' && <Text style={styles.youText}>You</Text>}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <LegendItem swatchStyle={styles.youSwatch} label="You" />
        {friendsCount > 0 && <LegendItem swatchStyle={styles.friendSwatch} label={`${friendsCount} friend${friendsCount === 1 ? '' : 's'}`} />}
        {codeCount > 0 && <LegendItem swatchStyle={styles.codeSwatch} label={`${codeCount} by code`} />}
        {matchedCount > 0 && <LegendItem swatchStyle={styles.matchedSwatch} label={`${matchedCount} matched by Gida`} />}
      </View>
    </View>
  );
}

function LegendItem({ swatchStyle, label }: { swatchStyle: object; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, swatchStyle]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: DesignSpacing.md,
    paddingVertical: DesignSpacing.xs,
  },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  youDot: {
    backgroundColor: DesignColors.primary,
    borderColor: DesignColors.primaryBright,
  },
  friendDot: {
    backgroundColor: DesignColors.primaryTintMid,
    borderColor: DesignColors.primaryBright,
  },
  codeDot: {
    backgroundColor: DesignColors.primaryTint,
    borderColor: DesignColors.primaryBright,
    borderStyle: 'dashed',
  },
  matchedDot: {
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderColor: DesignColors.outlineVariant,
    borderStyle: 'dashed',
  },
  youText: {
    fontSize: 9,
    fontWeight: '700',
    color: DesignColors.onPrimary,
    fontFamily,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  youSwatch: { backgroundColor: DesignColors.primary },
  friendSwatch: { backgroundColor: DesignColors.primaryTintStrong },
  codeSwatch: {
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryBright,
  },
  matchedSwatch: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignColors.outline,
    borderStyle: 'dashed',
  },
  legendText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});
