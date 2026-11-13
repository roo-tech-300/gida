import { StyleSheet } from 'react-native';
import { DesignColors, fontFamily } from '@/constants/design';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  safe: { flex: 1 },
  kav: { flex: 1 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingBottom: 16,
    paddingTop: 8,
  },
  backAbs: {
    position: 'absolute', left: 0,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: DesignColors.onSurface, fontFamily,
  },
  stepBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  stepDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: DesignColors.borderMedium,
  },
  stepDotActive: {
    backgroundColor: DesignColors.primary,
    width: 8, height: 8, borderRadius: 4,
  },
  stepLabel: {
    fontSize: 11, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily,
    marginLeft: 2,
  },

  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  searchSection: { gap: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 9999,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1, borderColor: DesignColors.borderSoft,
    paddingHorizontal: 20,
    height: 48,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: DesignColors.onSurface, fontFamily, paddingVertical: 0 },
  findBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },

  resultsList: { gap: 8, paddingTop: 20 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: DesignColors.cardBorder,
  },
  resultRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarSmall: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarSmallText: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  avatarImage: { width: '100%', height: '100%' },
  resultRowName: { fontSize: 15, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  resultRowMeta: { fontSize: 12, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2 },
  noResult: {
    textAlign: 'center', paddingTop: 40,
    fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily,
  },

  resultSection: { gap: 20, paddingTop: 32 },
  resultCard: {
    borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: DesignColors.glassStrong,
    borderWidth: 1, borderColor: DesignColors.primaryTintBorder,
  },
  resultLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: DesignColors.glassBorder,
    overflow: 'hidden',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  resultInfo: { gap: 4, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultName: { fontSize: 20, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  resultEmail: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, backgroundColor: DesignColors.successContainer,
    borderWidth: 1, borderColor: DesignColors.successContainer,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: DesignColors.secondary, fontFamily, letterSpacing: -0.3 },

  infoTextWrap: { paddingHorizontal: 8 },
  infoText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 22, opacity: 0.8 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingVertical: 32,
  },
  confirmBtn: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: DesignColors.primaryContainer,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmBtnDisabled: { backgroundColor: DesignColors.surfaceContainerHighest },
  confirmText: { fontSize: 17, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  confirmTextDisabled: { color: DesignColors.onSurfaceVariant },
});
