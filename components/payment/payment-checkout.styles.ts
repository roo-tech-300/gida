import { StyleSheet } from 'react-native';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },

  // ── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm,
  },
  topBarTitle: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },

  // ── Scrollable content ────────────────────────────────────────────────────
  content: {
    padding: DesignSpacing.md,
    paddingBottom: DesignSpacing.xl * 2,
    gap: DesignSpacing.md,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    padding: DesignSpacing.md,
    paddingTop: DesignSpacing.xs,
    gap: DesignSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignColors.borderFaint,
  },

  // ── Loading / error center ────────────────────────────────────────────────
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSpacing.lg,
  },

  // ── Status page (full-screen state views) ─────────────────────────────────
  statusPage: {
    flex: 1,
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.xl,
    paddingBottom: DesignSpacing.lg,
    gap: DesignSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.sm,
  },
  statusIconRingPending: {
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 2,
    borderColor: DesignColors.primaryTintBorder,
  },
  statusIconRingSuccess: {
    backgroundColor: 'rgba(165, 214, 183, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(165, 214, 183, 0.35)',
  },
  statusIconRingError: {
    backgroundColor: DesignColors.dangerContainer,
    borderWidth: 2,
    borderColor: 'rgba(255, 180, 171, 0.3)',
  },
  statusIconRingExpired: {
    backgroundColor: 'rgba(255, 208, 138, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255, 208, 138, 0.3)',
  },
  statusTextBlock: {
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  statusTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusSubtitle: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.xs,
    paddingHorizontal: DesignSpacing.sm,
    paddingVertical: 5,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    marginTop: DesignSpacing.xs,
  },
  statusChipText: {
    ...DesignTypography.labelSm,
    fontFamily,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // ── Stat row (amount display on success) ──────────────────────────────────
  successAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: DesignSpacing.xs,
  },
  successAmount: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: DesignColors.success,
    fontFamily,
    letterSpacing: -0.5,
  },
  successAmountLabel: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },

  // ── Hero card ─────────────────────────────────────────────────────────────
  heroCard: {
    borderRadius: DesignRadius.xl,
    overflow: 'hidden',
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  heroImage: { width: '100%', height: 140 },
  heroGradient: { ...StyleSheet.absoluteFill },
  heroFallback: {
    height: 80,
    backgroundColor: DesignColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: { padding: DesignSpacing.md, gap: 6 },
  heroLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.primaryBright,
    fontFamily,
    letterSpacing: 1.4,
    fontSize: 10,
  },
  heroTitle: {
    ...DesignTypography.titleMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  heroMeta: { flexDirection: 'row', gap: DesignSpacing.md, marginTop: 2 },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },

  // ── Amount card ───────────────────────────────────────────────────────────
  amountCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    borderRadius: DesignRadius.xl,
    padding: DesignSpacing.lg,
    gap: 6,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
  amountBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: DesignColors.primaryBright,
  },
  amountLabel: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    letterSpacing: 1.4,
    fontSize: 10,
  },
  amountValue: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: DesignColors.primaryBright,
    fontFamily,
    letterSpacing: -1,
    lineHeight: 48,
  },
  amountDivider: {
    height: 1,
    backgroundColor: DesignColors.borderSoft,
    marginVertical: DesignSpacing.xs,
  },
  amountNote: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 18,
  },

  // ── CTA buttons ───────────────────────────────────────────────────────────
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.full,
    paddingVertical: 16,
    shadowColor: DesignColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  payButtonDisabled: { opacity: 0.6 },
  payText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderRadius: DesignRadius.full,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: DesignColors.borderMedium,
  },
  secondaryButtonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  releaseLink: { alignItems: 'center', paddingVertical: DesignSpacing.xs },
  releaseText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.error,
    fontFamily,
    fontWeight: '600',
  },

  // ── Legacy aliases kept for glassCenterCard usages ────────────────────────
  glassCenterCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.xl,
    alignItems: 'center',
    gap: DesignSpacing.md,
    width: '100%',
  },
  mutedText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
    textAlign: 'center',
  },
  successBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: DesignColors.secondary,
    borderWidth: 6,
    borderColor: DesignColors.primaryTintMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
  },
  successDivider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: DesignColors.primaryBright,
    marginVertical: DesignSpacing.xs,
  },
  errorBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: DesignColors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.warning,
    fontFamily,
    fontWeight: '800',
  },
  pendingBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: DesignColors.primaryTint,
    borderWidth: 3,
    borderColor: DesignColors.primaryTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
  },
  pendingSubtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 22,
    textAlign: 'center',
  },
});
