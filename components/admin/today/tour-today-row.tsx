import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { AdminTour } from '@/types/tour-booking';

type Props = { tour: AdminTour; busy: boolean; onOpen: () => void; onDone: () => void };

export function TourTodayRow({ tour, busy, onOpen, onDone }: Props) {
  return (
    <View style={styles.row} testID={`tour-${tour.id}`}>
      <Pressable style={styles.main} onPress={onOpen} accessibilityRole="button">
        <Text style={styles.time}>{tour.scheduled_time}</Text>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={1}>{tour.student_name ?? 'A student'}</Text>
          <Text style={styles.meta} numberOfLines={1}>{tour.listings?.title ?? 'Property tour'}</Text>
        </View>
      </Pressable>
      <Pressable style={styles.done} onPress={onDone} disabled={busy} accessibilityRole="button" testID={`tour-done-${tour.id}`}>
        {busy ? <ActivityIndicator size="small" color={DesignColors.onSurface} /> : <Text style={styles.doneText}>Mark done</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, padding: DesignSpacing.md, borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md },
  time: { ...DesignTypography.labelLg, fontSize: 15, minWidth: 64, color: DesignColors.primaryFixed, fontFamily, fontWeight: '800' },
  copy: { flex: 1, gap: 2 },
  name: { ...DesignTypography.labelLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  meta: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  done: { height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center', borderWidth: 1, borderColor: DesignColors.borderMedium },
  doneText: { ...DesignTypography.labelSm, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
});
