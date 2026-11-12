import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PayColors } from './pay-theme';

type Tone = 'success' | 'neutral' | 'danger';
type Props = { tone: Tone; icon: keyof typeof Ionicons.glyphMap; title: string; body: string; testID?: string };

const TONES: Record<Tone, { tint: string; ink: string }> = {
  success: { tint: PayColors.successTint, ink: PayColors.success },
  neutral: { tint: PayColors.goldTint, ink: PayColors.goldDark },
  danger: { tint: PayColors.dangerTint, ink: PayColors.danger },
};

export function PayMessageState({ tone, icon, title, body, testID }: Props) {
  const colors = TONES[tone];
  return (
    <View style={styles.wrap} testID={testID}>
      <View style={[styles.badge, { backgroundColor: colors.tint }]}>
        <Ionicons name={icon} size={34} color={colors.ink} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12, paddingVertical: 32, paddingHorizontal: 8 },
  badge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: PayColors.ink, textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, color: PayColors.muted, textAlign: 'center', maxWidth: 360 },
});
