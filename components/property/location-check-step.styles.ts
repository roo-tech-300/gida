import { StyleSheet } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';

export const stepStyles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, marginTop: 4 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: DesignColors.onSurface,
    fontFamily,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0.2,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DesignColors.cardBorder,
  },
  lockChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: DesignColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitList: { gap: 8, paddingHorizontal: 4 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
});
