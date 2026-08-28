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
  
  // Updated Primary Theme (Gold/Bronze)
  primary: '#9D7E43',
  primaryContainer: '#6b542c', // Darkened for better contrast
  onPrimaryContainer: '#FFECD0',
  primaryFixed: '#d4ba88',      // Lighter tone for accents
  primaryBright: '#b8944f',     // Brighter version for active states
  onPrimary: '#0e0e10',
  
  secondary: '#9D7E43',
  secondaryContainer: '#806434',
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

  // Semantic status & feedback colors (harmonized with the dark/gold palette)
  success: '#a5d6b7',
  successContainer: 'rgba(165, 214, 183, 0.12)',
  warning: '#ffd08a',
  warningContainer: 'rgba(255, 208, 138, 0.12)',
  danger: '#ffb4ab',
  dangerContainer: 'rgba(255, 180, 171, 0.12)',
  info: '#b3c7ff',
  infoContainer: 'rgba(179, 199, 255, 0.12)',
  rating: '#f4c35c',

  // Brand gold tints (replace legacy green rgba(54,71,54,…) family)
  primaryTint: 'rgba(157, 126, 67, 0.12)',
  primaryTintMid: 'rgba(157, 126, 67, 0.2)',
  primaryTintStrong: 'rgba(157, 126, 67, 0.5)',
  primaryTintBorder: 'rgba(157, 126, 67, 0.4)',

  // Glass / overlay surfaces
  glassSoft: 'rgba(24, 24, 28, 0.5)',
  glassStrong: 'rgba(24, 24, 28, 0.65)',
  glassOpaque: 'rgba(24, 24, 28, 0.95)',

  // Border / divider / scrim alphas
  borderFaint: 'rgba(255, 255, 255, 0.04)',
  borderSoft: 'rgba(255, 255, 255, 0.06)',
  borderMedium: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(255, 255, 255, 0.2)',
  divider: 'rgba(199, 196, 216, 0.4)',
  scrimLight: 'rgba(0, 0, 0, 0.18)',
  scrim: 'rgba(0, 0, 0, 0.5)',
  scrimHeavy: 'rgba(0, 0, 0, 0.65)',
  scrimDeep: 'rgba(0, 0, 0, 0.9)',
  transparent: 'rgba(0, 0, 0, 0)',
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
  titleMd: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  labelCaps: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  labelLg: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
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
