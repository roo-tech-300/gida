import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import type { ProgressStep } from '@/utils/reservation-state';

const DOT = 24;

/** Reserved → Approved → Paid → Move in, in plain words. */
export function MyHomeStepper({ steps }: { steps: ProgressStep[] }) {
  return (
    <View style={styles.row} accessibilityRole="progressbar" testID="my-home-stepper">
      {steps.map((step, index) => {
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const reached = step.state !== 'todo';
        return (
          <View key={step.label} style={styles.step}>
            <View style={styles.dotRow}>
              <View style={[styles.line, isFirst && styles.lineHidden, reached && styles.lineDone]} />
              <View style={[styles.dot, step.state === 'done' && styles.dotDone, step.state === 'current' && styles.dotCurrent]}>
                {step.state === 'done' ? <Ionicons name="checkmark" size={14} color={DesignColors.onPrimary} /> : null}
                {step.state === 'current' ? <View style={styles.dotCore} /> : null}
              </View>
              <View style={[styles.line, isLast && styles.lineHidden, step.state === 'done' && styles.lineDone]} />
            </View>
            <Text style={[styles.label, reached && styles.labelOn, step.state === 'current' && styles.labelCurrent]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: 8 },
  dotRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  line: { flex: 1, height: 2, backgroundColor: DesignColors.surfaceContainerHighest },
  lineDone: { backgroundColor: DesignColors.primary },
  lineHidden: { backgroundColor: DesignColors.transparent },
  dot: {
    width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainer,
  },
  dotDone: { backgroundColor: DesignColors.primary },
  dotCurrent: { backgroundColor: DesignColors.primaryTintMid, borderWidth: 2, borderColor: DesignColors.primary },
  dotCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: DesignColors.primary },
  label: { ...DesignTypography.labelSm, color: DesignColors.outline, fontFamily },
  labelOn: { color: DesignColors.onSurfaceVariant },
  labelCurrent: { color: DesignColors.onSurface, fontWeight: '700' },
});
