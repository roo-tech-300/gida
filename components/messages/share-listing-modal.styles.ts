import { StyleSheet } from 'react-native';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: DesignColors.scrim,
  },
  sheet: {
    maxHeight: '78%',
    paddingHorizontal: DesignSpacing.md,
    paddingTop: DesignSpacing.sm,
    paddingBottom: DesignSpacing.xl,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: DesignColors.borderStrong,
    marginBottom: DesignSpacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    padding: DesignSpacing.sm,
    borderRadius: 22,
    backgroundColor: DesignColors.borderFaint,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    marginBottom: DesignSpacing.md,
  },
  previewThumb: {
    width: 56,
    height: 56,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  previewFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBody: {
    flex: 1,
    gap: 3,
  },
  previewTitle: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  previewMeta: {
    ...DesignTypography.labelLg,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginTop: 4,
    marginBottom: DesignSpacing.md,
  },
  loading: {
    marginVertical: DesignSpacing.xl,
  },
  empty: {
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: DesignSpacing.xl,
  },
  emptyText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    paddingHorizontal: DesignSpacing.lg,
  },
  errorNote: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginBottom: DesignSpacing.sm,
  },
  list: {
    gap: DesignSpacing.sm,
    paddingBottom: DesignSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    padding: DesignSpacing.sm,
    borderRadius: 22,
    backgroundColor: DesignColors.borderFaint,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...DesignTypography.labelLg,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowName: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  rowPreview: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
});