import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import type { InviteProblem } from '@/utils/invite-state';

/** A dead end that always says what happened and offers the next step. */
export function InviteProblemCard({ problem, onAction }: { problem: InviteProblem; onAction: () => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}><Ionicons name="alert-circle-outline" size={28} color={DesignColors.warning} /></View>
      <Text style={styles.title} accessibilityRole="header">{problem.title}</Text>
      <Text style={styles.body}>{problem.body}</Text>
      <Pressable accessibilityRole="button" onPress={onAction} style={styles.button}>
        <Text style={styles.buttonText}>{problem.actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: DesignSpacing.md, padding: DesignSpacing.xl },
  icon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.warningContainer },
  title: { fontFamily, fontSize: 22, fontWeight: '800', textAlign: 'center', color: DesignColors.onSurface },
  body: { fontFamily, fontSize: 14, lineHeight: 21, textAlign: 'center', color: DesignColors.onSurfaceVariant },
  button: { height: 48, paddingHorizontal: 28, borderRadius: DesignRadius.full, alignItems: 'center', justifyContent: 'center', marginTop: DesignSpacing.sm, borderWidth: 1.5, borderColor: DesignColors.primaryBright },
  buttonText: { fontFamily, fontSize: 14, fontWeight: '700', color: DesignColors.primaryFixed },
});
