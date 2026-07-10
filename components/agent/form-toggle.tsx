import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type FormToggleProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function FormToggle({ label, value, onChange }: FormToggleProps) {
  return (
    <Pressable style={styles.row} onPress={() => onChange(!value)}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, flex: 1, marginRight: DesignSpacing.md },
  track: { width: 44, height: 24, borderRadius: 12, backgroundColor: DesignColors.surfaceContainerHighest, justifyContent: 'center', paddingHorizontal: 3 },
  trackOn: { backgroundColor: DesignColors.primary },
  thumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: DesignColors.onSurface },
  thumbOn: { backgroundColor: DesignColors.onPrimary, alignSelf: 'flex-end' },
});
