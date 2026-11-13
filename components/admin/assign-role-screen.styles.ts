import { StyleSheet } from 'react-native';
import { DesignColors, fontFamily } from '@/constants/design';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  safe: { flex: 1 },
  kav: { flex: 1 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingBottom: 12, paddingTop: 8,
  },
  backAbs: { position: 'absolute', left: 0 },
  headerCenter: { alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  stepBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
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

  userPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'center',
    marginBottom: 14,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: DesignColors.primaryContainer,
    borderWidth: 1, borderColor: DesignColors.primaryTintBorder,
  },
  userPillText: { flexShrink: 1, fontSize: 14, fontWeight: '700', color: DesignColors.onSurface, fontFamily },

  subtitle: {
    fontSize: 14, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily,
    lineHeight: 20, paddingBottom: 24, opacity: 0.8,
  },

  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },

  optionsList: { gap: 12 },

  optionCard: {
    borderRadius: 20, padding: 18,
    backgroundColor: DesignColors.surface,
    borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  optionCardSelected: { borderColor: DesignColors.primaryTintStrong },
  optionCardExpandable: {
    borderColor: DesignColors.primaryTintStrong,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  optionTop: { flexDirection: 'row', gap: 14 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: DesignColors.borderMedium,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: { borderColor: DesignColors.primary },
  radioInner: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: DesignColors.primary,
  },
  optionContent: { flex: 1, gap: 6 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  optionDesc: {
    fontSize: 13, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily,
    lineHeight: 18, opacity: 0.7,
  },

  expandSection: {
    paddingHorizontal: 18, paddingBottom: 20,
    backgroundColor: DesignColors.surface,
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: DesignColors.primaryTintStrong,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  hintText: {
    fontSize: 12, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily,
    lineHeight: 17, opacity: 0.7,
    paddingTop: 12, paddingBottom: 2,
  },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: DesignColors.borderFaint,
    marginTop: 2,
  },
  pickerText: { flex: 1, fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  pickerPlaceholder: { color: DesignColors.onSurfaceVariant, opacity: 0.6 },

  dropdown: {
    marginTop: 6, borderRadius: 12, overflow: 'hidden',
    backgroundColor: DesignColors.borderFaint,
  },
  dropdownLoader: { paddingVertical: 16 },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 14,
  },
  dropdownItemSelected: { backgroundColor: DesignColors.primaryTint },
  dropdownItemTextWrap: { flex: 1 },
  dropdownText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  dropdownTextSelected: { color: DesignColors.primary },
  dropdownMeta: { fontSize: 11, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily, marginTop: 2, opacity: 0.6 },
  dropdownSearch: {
    fontSize: 13, fontWeight: '600', color: DesignColors.onSurface, fontFamily,
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: DesignColors.borderSoft,
  },
  dropdownEmpty: {
    paddingVertical: 16, textAlign: 'center',
    fontSize: 13, fontWeight: '600', color: DesignColors.onSurfaceVariant, fontFamily, opacity: 0.5,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingVertical: 32,
  },
  continueBtn: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: DesignColors.primaryContainer,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  continueBtnDisabled: { backgroundColor: DesignColors.surfaceContainerHighest },
  continueText: { fontSize: 17, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  continueTextDisabled: { color: DesignColors.onSurfaceVariant },
});
