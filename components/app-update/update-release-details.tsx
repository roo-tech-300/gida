import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

/** Release notes plus what happens after tapping Download (shared by both prompts). */
export function UpdateReleaseDetails({ notes }: { notes: string | null }) {
  return (
    <View style={styles.wrap}>
      {notes ? (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>WHAT&apos;S NEW</Text>
          <Text style={styles.notesText} numberOfLines={6}>
            {notes}
          </Text>
        </View>
      ) : null}
      <Text style={styles.hint}>
        The download opens in your browser. When it finishes, open the file to install. You stay signed in and keep
        your data.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: DesignSpacing.md },
  notes: {
    gap: DesignSpacing.xs,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  notesLabel: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, fontFamily },
  notesText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, lineHeight: 22 },
  hint: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20 },
});
