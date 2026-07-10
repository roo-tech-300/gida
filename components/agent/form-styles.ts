import { StyleSheet } from 'react-native';
import { DesignColors, DesignLayout, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  headerSafe: { backgroundColor: 'rgba(14, 14, 16, 0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm, paddingHorizontal: DesignSpacing.marginMobile, paddingVertical: DesignSpacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.lg, paddingBottom: 130, gap: 24 },
  hero: { marginBottom: DesignSpacing.sm },
  heroTitle: { fontSize: 30, fontWeight: '800', color: DesignColors.primary, fontFamily, marginBottom: DesignSpacing.xs },
  heroSub: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, opacity: 0.8, lineHeight: 22 },
  fieldGroup: { gap: 10 },
  label: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, paddingHorizontal: DesignSpacing.md },
  caption: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, paddingHorizontal: DesignSpacing.md, opacity: 0.65, lineHeight: 16 },
  error: { ...DesignTypography.labelSm, color: DesignColors.error, paddingHorizontal: DesignSpacing.md },
  footer: { paddingHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.md, backgroundColor: DesignColors.surfaceContainerLowest, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  submitBtn: { backgroundColor: '#7C3AED', borderRadius: DesignRadius.lg, height: DesignLayout.buttonHeight, alignItems: 'center', justifyContent: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  submitDisabled: { opacity: 0.5 },
  submitText: { ...DesignTypography.bodyLg, color: '#ffffff', fontFamily, fontWeight: '700' },
});
