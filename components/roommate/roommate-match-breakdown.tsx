import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { MatchBreakdown } from '@/utils/roommateCompatibility';

export function RoommateMatchBreakdown({ match }: { match: MatchBreakdown }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{match.isReady ? `Why ${match.score}%?` : 'Compatibility'}</Text>
        {match.isReady && (
          <View style={styles.scorePill}>
            <Text style={styles.scoreText}>{match.score}%</Text>
          </View>
        )}
      </View>

      {match.reasons.map((reason) => (
        <View key={reason} style={styles.row}>
          <Ionicons
            name={match.isReady ? 'checkmark-circle-outline' : 'information-circle-outline'}
            size={18}
            color={match.isReady ? DesignColors.secondary : DesignColors.onSurfaceVariant}
          />
          <Text style={styles.reason}>{reason}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.lg,
    gap: DesignSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  scorePill: {
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: DesignColors.primaryBright,
    fontFamily,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  reason: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
    lineHeight: 20,
  },
});
