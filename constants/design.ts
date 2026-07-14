/**
 * Gida design tokens — sourced from md files/Design.md
 */

export const DesignColors = {
  surface: '#131315',
  surfaceContainerLowest: '#0e0e10',
  surfaceContainerLow: '#1b1b1d',
  surfaceContainer: '#201f21',
  surfaceContainerHigh: '#2a2a2c',
  surfaceContainerHighest: '#353437',
  onSurface: '#e5e1e4',
  onSurfaceVariant: '#c7c4d8',
  outline: '#958da1',
  outlineVariant: '#4a4455',
  primary: '#c3c0ff',
  primaryContainer: '#4f46e5',
  primaryFixed: '#eaddff',
  primaryBright: '#d2bbff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#ffffff',
  secondary: '#4edea3',
  secondaryContainer: '#00b954',
  tertiary: '#ffb695',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  textPrimary: '#f2f2f7',
  textSecondary: '#71717a',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  inputBorder: 'rgba(113, 113, 122, 0.2)',
  glassFill: 'rgba(27, 27, 29, 0.8)',
  glassBg: 'rgba(24, 24, 28, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
} as const;

export const DesignSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  marginMobile: 20,
  marginDesktop: 48,
  gutter: 16,
} as const;

export const DesignRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const DesignTypography = {
  headlineLg: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.24,
  },
  headlineMd: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  labelCaps: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  labelSm: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
  },
} as const;

export const DesignLayout = {
  maxContentWidth: 1200,
  authCardMaxWidth: 440,
  buttonHeight: 56,
  desktopBreakpoint: 768,
} as const;

export const fontFamily = 'Inter';
