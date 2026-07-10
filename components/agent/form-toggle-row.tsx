import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type ToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
};

export function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <View style={tog.row}>
      <Text style={tog.label}>{label}</Text>
      <ToggleInline value={value} onChange={onChange} />
    </View>
  );
}

export function ToggleInline({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={[tog.track, value && tog.trackOn]}>
      <View style={[tog.thumb, value && tog.thumbOn]} />
    </Pressable>
  );
}

const tog = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: DesignSpacing.xs },
  label: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, flex: 1, marginRight: DesignSpacing.md },
  track: { width: 44, height: 24, borderRadius: 12, backgroundColor: DesignColors.surfaceContainerHighest, justifyContent: 'center', paddingHorizontal: 3 },
  trackOn: { backgroundColor: DesignColors.primary },
  thumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#ffffff' },
  thumbOn: { alignSelf: 'flex-end' },
});
