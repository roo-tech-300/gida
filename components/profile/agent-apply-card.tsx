import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function AgentApplyCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="business-outline" size={28} color={DesignColors.primaryBright} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Earn with Gida</Text>
          <Text style={styles.desc}>
            Become a verified campus housing agent to list hostels, lodges, or single self-contained spaces around campus.
          </Text>
        </View>
      </View>
      <Pressable style={styles.button} onPress={() => router.push('/agent/apply')}>
        <Text style={styles.buttonText}>Apply for Agent Status</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: DesignSpacing.lg, paddingTop: DesignSpacing.sm },
  row: { flexDirection: 'row', gap: DesignSpacing.md },
  iconWrap: { width: 48, height: 48, borderRadius: DesignRadius.lg, backgroundColor: 'rgba(74, 225, 118, 0.08)', alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, gap: 4 },
  title: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  desc: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20 },
  button: {
    marginTop: DesignSpacing.md, paddingVertical: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md,
    borderRadius: DesignRadius.lg, backgroundColor: 'rgba(74, 225, 118, 0.12)',
    borderWidth: 1, borderColor: 'rgba(74, 225, 118, 0.2)', alignItems: 'center',
  },
  buttonText: { ...DesignTypography.bodyMd, color: DesignColors.secondary, fontFamily, fontWeight: '600' },
});
