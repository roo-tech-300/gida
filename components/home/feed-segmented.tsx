import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export type FeedMode = 'places' | 'people';

const OPTIONS: { mode: FeedMode; label: string }[] = [
  { mode: 'places', label: 'Places' },
  { mode: 'people', label: 'People' },
];

type Props = { mode: FeedMode; onChange: (mode: FeedMode) => void };

/** The always-visible switch between finding a place and finding people to live with. */
export function FeedSegmented({ mode, onChange }: Props) {
  return (
    <View style={styles.track} accessibilityRole="tablist" testID="feed-segmented">
      {OPTIONS.map((option) => {
        const active = option.mode === mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => onChange(option.mode)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            testID={`feed-mode-${option.mode}`}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row', marginHorizontal: DesignSpacing.marginMobile, padding: 4, borderRadius: 24,
    backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  segment: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: DesignColors.primary },
  label: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily },
  labelActive: { color: DesignColors.onPrimary, fontWeight: '700' },
});
