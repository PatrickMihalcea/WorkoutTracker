export const colors = {
  primary: '#ffffff',
  primaryLight: '#cccccc',
  primaryDark: '#e0e0e0',
  background: '#07090f',
  surface: '#0e1722',
  surfaceLight: '#162230',
  text: '#ffffff',
  textSecondary: '#d0d0d0',
  textMuted: '#8aa5b5',
  success: '#d0d0d0',
  warning: '#999999',
  danger: '#aaaaaa',
  border: '#1d2e40',
  accent: '#38CEC4',
  accentDim: 'rgba(56, 206, 196, 0.12)',
} as const;

/** Pre-defined gradient color stops for LinearGradient. */
export const gradients = {
  /** Full-screen background — subtle depth, top to bottom. */
  background: ['#0b0f14', '#090c11'] as const,
  /** Card / surface — diagonal lift gives depth without being busy. */
  surface: ['#0f141a', '#0c1116'] as const,
  /** Bottom sheet / elevated modal background. */
  surfaceElevated: ['#13181f', '#10151c'] as const,
  /** Primary button — white to barely-teal. */
  primaryButton: ['#f6fffe', '#edfaf9'] as const,
  /** Selected chip — faint teal wash instead of flat white. */
  chipSelected: ['#f2fefc', '#e6faf8'] as const,
} as const;

export const fonts = {
  regular: 'Monospaceland-Regular',
  semiBold: 'Monospaceland-SemiBold',
  bold: 'Monospaceland-Bold',
  light: 'Monospaceland-Light',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  bottom: 175
} as const;
