import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useSharePaymentLink } from '@/hooks/use-share-payment-link';

type Props = { creditId: string; amount: number; placeTitle: string | null | undefined };

/** Offers the common Nigerian reality up front: a parent often pays. No account needed on their side. */
export function WhoPaysCard({ creditId, amount, placeTitle }: Props) {
  const { share, isSharing } = useSharePaymentLink();

  return (
    <View style={styles.card} testID="who-pays-card">
      <View style={styles.icon}>
        <Ionicons name="people-outline" size={20} color={DesignColors.primaryFixed} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Is a parent paying?</Text>
        <Text style={styles.body}>Send them a link. They pay on their phone, with no account.</Text>
      </View>
      <Pressable
        style={[styles.button, isSharing && styles.disabled]}
        onPress={() => share({ creditId, amount, placeTitle })}
        disabled={isSharing}
        accessibilityRole="button"
        accessibilityLabel="Send payment link to a parent"
        testID="send-to-parent-btn"
      >
        {isSharing ? <ActivityIndicator size="small" color={DesignColors.primaryFixed} /> : <Text style={styles.buttonText}>Send link</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md, padding: DesignSpacing.md,
    borderRadius: DesignRadius.xl, borderWidth: 1, borderColor: DesignColors.primaryTintBorder, backgroundColor: DesignColors.surfaceContainerLow,
  },
  icon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primaryTint,
  },
  text: { flex: 1, gap: 2 },
  title: { ...DesignTypography.titleMd, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  body: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 19 },
  button: {
    minWidth: 84, height: 40, paddingHorizontal: DesignSpacing.md, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: DesignColors.primaryFixed,
  },
  disabled: { opacity: 0.6 },
  buttonText: { ...DesignTypography.labelLg, color: DesignColors.primaryFixed, fontFamily, fontWeight: '700' },
});
