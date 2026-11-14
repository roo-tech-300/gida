import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';

type Tone = 'neutral' | 'warn' | 'ok';
type Action = { label: string; onPress: () => void };

type Props = {
  initials?: string;
  title: string;
  subtitle: string;
  tone?: Tone;
  /** A small status chip on the right, e.g. "Paid". */
  chip?: string;
  open?: boolean;
  actions?: Action[];
};

const TONE_COLOR: Record<Tone, string> = { neutral: DesignColors.outline, warn: DesignColors.warning, ok: DesignColors.success };

/** One seat in the founder's household list: a member, a link that is out, or an empty seat. */
export function SeatRow({ initials, title, subtitle, tone = 'neutral', chip, open = false, actions = [] }: Props) {
  return (
    <View style={[styles.row, open && styles.rowOpen]}>
      <View style={[styles.avatar, open && styles.avatarOpen]}>
        {initials ? <Text style={styles.initials}>{initials}</Text> : null}
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, open && styles.titleOpen]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.subtitle, { color: TONE_COLOR[tone] }]} numberOfLines={2}>{subtitle}</Text>
      </View>
      <View style={styles.right}>
        {chip ? <View style={styles.chip}><Text style={styles.chipText}>{chip}</Text></View> : null}
        {actions.map((action) => (
          <Pressable key={action.label} accessibilityRole="button" onPress={action.onPress} hitSlop={6}>
            <Text style={styles.action}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, padding: DesignSpacing.md, borderRadius: DesignRadius.lg, backgroundColor: DesignColors.surfaceContainerLow },
  rowOpen: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: DesignColors.borderMedium },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary },
  avatarOpen: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: DesignColors.borderStrong },
  initials: { fontFamily, fontSize: 12, fontWeight: '800', color: DesignColors.onPrimary },
  text: { flex: 1, gap: 2 },
  title: { fontFamily, fontSize: 14, fontWeight: '700', color: DesignColors.onSurface },
  titleOpen: { color: DesignColors.outline },
  subtitle: { fontFamily, fontSize: 12 },
  right: { alignItems: 'flex-end', gap: 6 },
  chip: { height: 24, paddingHorizontal: 10, borderRadius: 12, justifyContent: 'center', backgroundColor: DesignColors.borderSoft },
  chipText: { fontFamily, fontSize: 11, fontWeight: '700', color: DesignColors.onSurfaceVariant },
  action: { fontFamily, fontSize: 13, fontWeight: '700', color: DesignColors.primaryFixed },
});
