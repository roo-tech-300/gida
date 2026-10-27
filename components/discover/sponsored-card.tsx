import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import type { SponsoredPlacement } from '@/types/sponsored';

type Props = {
  placement: SponsoredPlacement;
  onPress: () => void;
};

export function SponsoredCard({ placement, onPress }: Props) {
  return (
    <Pressable
      accessibilityLabel={`${placement.sponsor}, sponsored. ${placement.headline}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons color={DesignColors.onPrimaryContainer} name="megaphone-outline" size={18} />
        </View>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.sponsor}>
            {placement.sponsor}
          </Text>
          <Text style={styles.label}>Sponsored</Text>
        </View>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeLabel}>AD</Text>
        </View>
      </View>

      <Text style={styles.headline}>{placement.headline}</Text>
      <Text style={styles.body}>{placement.body}</Text>

      <View style={styles.ctaRow}>
        <Text style={styles.ctaLabel}>{placement.ctaLabel}</Text>
        <Ionicons color={DesignColors.primaryFixed} name="arrow-forward" size={15} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    backgroundColor: DesignColors.primaryTint,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTintStrong,
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  sponsor: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  adBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  adBadgeLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  headline: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: DesignColors.textPrimary,
    fontFamily,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  ctaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: DesignSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignColors.primaryTintBorder,
  },
  ctaLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
});