import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function ActiveAgentCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="verified-user" size={28} color={DesignColors.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Active Agent Workspace</Text>
          <Text style={styles.desc}>
            Your agent account is fully verified. You can now manage your active listings, track student inquiries, and publish new campus properties.
          </Text>
        </View>
      </View>
      <Pressable style={styles.button} onPress={() => router.push('/agent/portfolio')}>
        <Text style={styles.buttonText}>Manage Listings Portfolio</Text>
        <Ionicons name="arrow-forward" size={18} color={DesignColors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: DesignSpacing.lg, paddingTop: DesignSpacing.sm },
  row: { flexDirection: 'row', gap: DesignSpacing.md },
  iconWrap: { width: 48, height: 48, borderRadius: DesignRadius.lg, backgroundColor: 'rgba(124, 58, 237, 0.1)', alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, gap: 4 },
  title: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  desc: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 20 },
  button: {
    marginTop: DesignSpacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.sm,
    paddingVertical: DesignSpacing.sm, paddingHorizontal: DesignSpacing.md,
    borderRadius: DesignRadius.lg, backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  buttonText: { ...DesignTypography.bodyMd, color: DesignColors.primary, fontFamily, fontWeight: '600' },
});
