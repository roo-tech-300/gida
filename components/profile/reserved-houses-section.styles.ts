import { StyleSheet } from 'react-native';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export const styles = StyleSheet.create({
  section: {
    marginHorizontal: DesignSpacing.marginMobile,
    gap: DesignSpacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    paddingTop: 2,
  },
  sectionHint: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  list: {
    gap: DesignSpacing.md,
  },
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    overflow: 'hidden',
  },
  coverWrap: {
    height: 108,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  coverImage: {
    flex: 1,
    justifyContent: 'space-between',
    padding: DesignSpacing.sm,
  },
  coverImageInner: {
    borderTopLeftRadius: DesignRadius.xl,
    borderTopRightRadius: DesignRadius.xl,
  },
  coverScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  coverBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: DesignRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  coverBadgeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.surface,
    fontFamily,
    fontWeight: '700',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  cardBody: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
    gap: 2,
  },
  cardTitle: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  cardMeta: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  statusPill: {
    ...DesignTypography.labelSm,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryTint,
    overflow: 'hidden',
  },
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: 2,
  },
  stateText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
    lineHeight: 20,
  },
});
