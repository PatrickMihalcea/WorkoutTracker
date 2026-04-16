export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentDim: string;
}

export interface ThemeGradients {
  background: readonly [string, string];
  surface: readonly [string, string];
  surfaceElevated: readonly [string, string];
  primaryButton: readonly [string, string];
  chipSelected: readonly [string, string];
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  gradients: ThemeGradients;
  setCompletion: string;
}

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      background: '#07090f',
      surface: '#0e1722',
      surfaceLight: '#162230',
      text: '#ffffff',
      textSecondary: '#d0d0d0',
      textMuted: '#8aa5b5',
      border: '#1d2e40',
      accent: '#38CEC4',
      accentDim: 'rgba(56, 206, 196, 0.12)',
    },
    gradients: {
      background: ['#0b0f14', '#090c11'],
      surface: ['#0f141a', '#0c1116'],
      surfaceElevated: ['#13181f', '#10151c'],
      primaryButton: ['#f6fffe', '#edfaf9'],
      chipSelected: ['#f2fefc', '#e6faf8'],
    },
    setCompletion: '#38CEC4',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      background: '#060a12',
      surface: '#0c1423',
      surfaceLight: '#132038',
      text: '#ffffff',
      textSecondary: '#ccd5e0',
      textMuted: '#7a99b8',
      border: '#1b2f4a',
      accent: '#29B6F6',
      accentDim: 'rgba(41, 182, 246, 0.12)',
    },
    gradients: {
      background: ['#080d17', '#050810'],
      surface: ['#0d1826', '#0a1320'],
      surfaceElevated: ['#111e2e', '#0e192a'],
      primaryButton: ['#f0faff', '#e3f5fd'],
      chipSelected: ['#eaf8ff', '#daf2fc'],
    },
    setCompletion: '#29B6F6',
  },
  {
    id: 'fire',
    name: 'Fire',
    colors: {
      background: '#0d0906',
      surface: '#1a100b',
      surfaceLight: '#261710',
      text: '#ffffff',
      textSecondary: '#e0d0c8',
      textMuted: '#a08070',
      border: '#3a1f12',
      accent: '#FF7043',
      accentDim: 'rgba(255, 112, 67, 0.12)',
    },
    gradients: {
      background: ['#100b07', '#0a0704'],
      surface: ['#1b120e', '#140e09'],
      surfaceElevated: ['#201613', '#1a120e'],
      primaryButton: ['#fff8f5', '#ffeee8'],
      chipSelected: ['#fff4f0', '#ffe8e0'],
    },
    setCompletion: '#FF7043',
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      background: '#070d08',
      surface: '#0c1510',
      surfaceLight: '#122018',
      text: '#ffffff',
      textSecondary: '#c8d8cc',
      textMuted: '#7a9e82',
      border: '#1a3022',
      accent: '#66BB6A',
      accentDim: 'rgba(102, 187, 106, 0.12)',
    },
    gradients: {
      background: ['#090e0a', '#060b07'],
      surface: ['#0e1812', '#0b140f'],
      surfaceElevated: ['#131e17', '#101a14'],
      primaryButton: ['#f4fef5', '#e8faeb'],
      chipSelected: ['#f0fef2', '#e4f8e6'],
    },
    setCompletion: '#66BB6A',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    colors: {
      background: '#09070f',
      surface: '#120e1c',
      surfaceLight: '#1b1528',
      text: '#ffffff',
      textSecondary: '#d5cce0',
      textMuted: '#9080aa',
      border: '#2a1f40',
      accent: '#CE93D8',
      accentDim: 'rgba(206, 147, 216, 0.12)',
    },
    gradients: {
      background: ['#0c0a13', '#08070e'],
      surface: ['#14101f', '#0f0d19'],
      surfaceElevated: ['#1c1828', '#181424'],
      primaryButton: ['#fdf6ff', '#f8eafe'],
      chipSelected: ['#fbf2ff', '#f6e8fe'],
    },
    setCompletion: '#CE93D8',
  },
  {
    id: 'gold',
    name: 'Gold',
    colors: {
      background: '#0f0c05',
      surface: '#1c1608',
      surfaceLight: '#28200c',
      text: '#ffffff',
      textSecondary: '#e0d8c0',
      textMuted: '#a09060',
      border: '#3a2e10',
      accent: '#FFD54F',
      accentDim: 'rgba(255, 213, 79, 0.12)',
    },
    gradients: {
      background: ['#120e06', '#0c0a04'],
      surface: ['#1e190a', '#191508'],
      surfaceElevated: ['#231e0c', '#1e1a09'],
      primaryButton: ['#fffdf0', '#fffae0'],
      chipSelected: ['#fffce8', '#fff8d8'],
    },
    setCompletion: '#FFD54F',
  },
  {
    id: 'cherry',
    name: 'Cherry',
    colors: {
      background: '#0f0709',
      surface: '#1c0d12',
      surfaceLight: '#28121a',
      text: '#ffffff',
      textSecondary: '#e0c8d0',
      textMuted: '#a07888',
      border: '#3a1a24',
      accent: '#F48FB1',
      accentDim: 'rgba(244, 143, 177, 0.12)',
    },
    gradients: {
      background: ['#12090b', '#0c0608'],
      surface: ['#1e0f14', '#180c10'],
      surfaceElevated: ['#221318', '#1c1015'],
      primaryButton: ['#fff5f8', '#ffeaf0'],
      chipSelected: ['#fff0f4', '#ffe5ec'],
    },
    setCompletion: '#F48FB1',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    colors: {
      background: '#060c10',
      surface: '#0b141c',
      surfaceLight: '#102030',
      text: '#ffffff',
      textSecondary: '#c8dce8',
      textMuted: '#7099ae',
      border: '#163248',
      accent: '#80DEEA',
      accentDim: 'rgba(128, 222, 234, 0.12)',
    },
    gradients: {
      background: ['#080e14', '#060a10'],
      surface: ['#0d181e', '#0a141a'],
      surfaceElevated: ['#111e26', '#0e1a22'],
      primaryButton: ['#f2feff', '#e6fbfe'],
      chipSelected: ['#ecfdff', '#e0f9fc'],
    },
    setCompletion: '#80DEEA',
  },
  {
    id: 'void',
    name: 'Void',
    colors: {
      background: '#090909',
      surface: '#131313',
      surfaceLight: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#c0c0c0',
      textMuted: '#707070',
      border: '#2a2a2a',
      accent: '#d0d0d0',
      accentDim: 'rgba(208, 208, 208, 0.12)',
    },
    gradients: {
      background: ['#0c0c0c', '#080808'],
      surface: ['#151515', '#111111'],
      surfaceElevated: ['#1a1a1a', '#161616'],
      primaryButton: ['#f8f8f8', '#eeeeee'],
      chipSelected: ['#f5f5f5', '#ebebeb'],
    },
    setCompletion: 'transparent',
  },
];

export const DEFAULT_THEME = THEMES[0];

export const THEME_MAP: Record<string, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
);
