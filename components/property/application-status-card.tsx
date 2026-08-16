import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  deadline: string;
  onCancelPress: () => void;
};

function formatDeadline(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ApplicationStatusCard({ deadline, onCancelPress }: Props) {
  const due = formatDeadline(deadline);
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name="hourglass-outline" size={20} color={DesignColors.primaryBright} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Application submitted</Text>
        <Text style={styles.subtitle}>
          {due ? `Pay by ${due} to keep your spot on this property.` : 'Pay within the deadline to keep your spot.'}
        </Text>
      </View>
      <Pressable onPress={onCancelPress} style={styles.cancelBtn} hitSlop={8}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    borderRadius: DesignRadius.lg,
    padding: DesignSpacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignColors.surface,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  subtitle: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 16 },
  cancelBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  cancelText: { ...DesignTypography.labelSm, color: DesignColors.primaryBright, fontFamily, fontWeight: '700', textDecorationLine: 'underline' },
});
