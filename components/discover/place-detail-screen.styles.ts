import { StyleSheet } from 'react-native';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  sheet: {
    marginTop: -28,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: 12,
    paddingBottom: DesignSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  cta: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: DesignColors.primary,
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: DesignColors.onPrimary,
    fontFamily,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  notFoundHeader: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
  },
});
