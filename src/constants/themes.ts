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
  metricCardBackground: string;
  metricCardBorder: string;
  recordText: string;
}

export interface ThemeGradients {
  background: readonly [string, string];
  surface: readonly [string, string];
  surfaceElevated: readonly [string, string];
  accent: readonly [string, string];
  primaryButton: readonly [string, string];
  chipSelected: readonly [string, string];
  records: readonly [string, string];
  metricCard: readonly [string, string];
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  gradients: ThemeGradients;
  setCompletion: string;
}

export function isLightTheme(themeOrId: Theme | string): boolean {
  const themeId = typeof themeOrId === 'string' ? themeOrId : themeOrId.id;
  return themeId.startsWith('light_');
}

// ─── Dark mode shared values ──────────────────────────────────────────────────
// All dark themes share the same base. Individual themes only define accent,
// accentDim, surfaceElevated gradient, accent gradient, and primaryButton.

const DARK_COLORS = {
  background: '#000000',
  surface: '#111111',
  surfaceLight: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#FFFFFF',
  textMuted: '#464444',
  border: '#2A2A2A',
  metricCardBackground: '#161B23',
  metricCardBorder: '#2A303A',
  recordText: '#8BE1B8',
} as const;

const DARK_GRADIENTS = {
  background: ['#000000', '#000000'] as const,
  surface: ['#141414', '#0F0F0F'] as const,
  chipSelected: ['#ffffff', '#ffffff'] as const,
  records: ['#122828', '#0a1a1a'] as const,
  metricCard: ['#1E2535', '#111820'] as const,
};

// ─── Light mode shared values ─────────────────────────────────────────────────
// Light themes share text and card colours. Backgrounds, surfaces, and borders
// vary per theme and stay in the individual definitions below.

const LIGHT_COLORS = {
  text: '#050709',
  textSecondary: '#151A22',
  textMuted: '#3F4652',
  metricCardBackground: '#FFFFFF',
  metricCardBorder: '#C8CDD5',
  recordText: '#0A6B42',
} as const;

const LIGHT_GRADIENTS = {
  background: ['#E4E7EB', '#E4E7EB'] as const,
  surface: ['#F2F4F6', '#ECEFF3'] as const,
  chipSelected: ['#D0D4DA', '#C4C9D2'] as const,
  records: ['#D0EDE0', '#EAF7EF'] as const,
  metricCard: ['#FFFFFF', '#F2F5F8'] as const,
};

// ─────────────────────────────────────────────────────────────────────────────

export const THEMES: Theme[] = [
  // ── Dark themes ─────────────────────────────────────────────────────────────
  {
    id: 'default',
    name: 'Default',
    colors: { ...DARK_COLORS, accent: '#43E0D3', accentDim: 'rgba(67, 224, 211, 0.16)', textSecondary: '#ffffffcd' },
    gradients: { ...DARK_GRADIENTS, surfaceElevated: ['#1D1D1D', '#151515'], accent: ['#2A7A74', '#2A7A74'], primaryButton: ['#FFFFFF', '#EAFBF9'] },
    setCompletion: '#43E0D3',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: { ...DARK_COLORS, accent: '#38BDF8', accentDim: 'rgba(56, 189, 248, 0.16)' },
    gradients: { ...DARK_GRADIENTS, surfaceElevated: ['#1B2025', '#14181C'], accent: ['#1A5E86', '#1A5E86'], primaryButton: ['#FFFFFF', '#E8F7FF'] },
    setCompletion: '#38BDF8',
  },
  {
    id: 'fire',
    name: 'Fire',
    colors: { ...DARK_COLORS, accent: '#FF7A45', accentDim: 'rgba(255, 122, 69, 0.16)' },
    gradients: { ...DARK_GRADIENTS, surfaceElevated: ['#1F1B19', '#171413'], accent: ['#8B3C1B', '#8B3C1B'], primaryButton: ['#FFFFFF', '#FFF0E8'] },
    setCompletion: '#FF7A45',
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: { ...DARK_COLORS, accent: '#6DD47E', accentDim: 'rgba(109, 212, 126, 0.16)' },
    gradients: { ...DARK_GRADIENTS, surfaceElevated: ['#1B201B', '#141714'], accent: ['#336B3A', '#336B3A'], primaryButton: ['#FFFFFF', '#EDF9EF'] },
    setCompletion: '#6DD47E',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    colors: { ...DARK_COLORS, accent: '#B388FF', accentDim: 'rgba(179, 136, 255, 0.16)' },
    gradients: { ...DARK_GRADIENTS, surfaceElevated: ['#1D1A24', '#15131A'], accent: ['#5A3B8C', '#5A3B8C'], primaryButton: ['#FFFFFF', '#F2EAFF'] },
    setCompletion: '#B388FF',
  },
  {
    id: 'gold',
    name: 'Gold',
    colors: { ...DARK_COLORS, accent: '#F6C453', accentDim: 'rgba(246, 196, 83, 0.16)' },
    gradients: { ...DARK_GRADIENTS, surfaceElevated: ['#1F1D19', '#171614'], accent: ['#7A591A', '#7A591A'], primaryButton: ['#FFFFFF', '#FFF6DD'] },
    setCompletion: '#F6C453',
  },
  {
    id: 'cherry',
    name: 'Cherry',
    colors: { ...DARK_COLORS, accent: '#F472A6', accentDim: 'rgba(244, 114, 166, 0.16)' },
    gradients: { ...DARK_GRADIENTS, surfaceElevated: ['#1F1A1D', '#171315'], accent: ['#7A2650', '#7A2650'], primaryButton: ['#FFFFFF', '#FFE8F0'] },
    setCompletion: '#F472A6',
  },
  {
    id: 'void',
    name: 'Void',
    colors: { ...DARK_COLORS, accent: '#A3A3A3', accentDim: 'rgba(163, 163, 163, 0.16)' },
    gradients: { ...DARK_GRADIENTS, surfaceElevated: ['#1B1B1B', '#141414'], accent: ['#525252', '#525252'], primaryButton: ['#FFFFFF', '#ECECEC'] },
    setCompletion: '#A3A3A3',
  },

  // ── Light themes ─────────────────────────────────────────────────────────────
  {
    id: 'light_galaxy',
    name: 'Iris',
    colors: { ...LIGHT_COLORS, background: '#E4DFF0', surface: '#F3F0F8', surfaceLight: '#E9E3F4', border: '#CEC4DE', accent: '#6D28D9', accentDim: 'rgba(109, 40, 217, 0.14)' },
    gradients: { ...LIGHT_GRADIENTS, background: ['#E4DFF0', '#E4DFF0'], surface: ['#F3F0F8', '#ECE6F5'], surfaceElevated: ['#FAF8FC', '#E2DAEF'], accent: ['#6D28D9', '#5B21B6'], primaryButton: ['#080510', '#1E1533'], chipSelected: ['#DDD2F2', '#CDBBEA'] },
    setCompletion: '#6D28D9',
  },

  {
    id: 'light_cherry',
    name: 'Petal',
    colors: { ...LIGHT_COLORS, background: '#EADCE3', surface: '#F6EDF1', surfaceLight: '#EEE1E8', border: '#D7C0CB', accent: '#BE185D', accentDim: 'rgba(190, 24, 93, 0.14)' },
    gradients: { ...LIGHT_GRADIENTS, background: ['#EADCE3', '#EADCE3'], surface: ['#F6EDF1', '#F0E3EA'], surfaceElevated: ['#FBF7F9', '#E8D7E0'], accent: ['#BE185D', '#9D174D'], primaryButton: ['#0D0508', '#2A1019'], chipSelected: ['#F1C8D9', '#E9B0C8'] },
    setCompletion: '#BE185D',
  },
  {
    id: 'light_arctic',
    name: 'Arctic',
    colors: { ...LIGHT_COLORS, background: '#DDE8EA', surface: '#F0F6F7', surfaceLight: '#E3EEF0', border: '#C2D3D7', accent: '#0891B2', accentDim: 'rgba(8, 145, 178, 0.14)' },
    gradients: { ...LIGHT_GRADIENTS, background: ['#DDE8EA', '#DDE8EA'], surface: ['#F0F6F7', '#E7F1F3'], surfaceElevated: ['#F8FBFC', '#DCEBEE'], accent: ['#0891B2', '#0E7490'], primaryButton: ['#03090A', '#102023'], chipSelected: ['#C9E9EF', '#B4DDE6'] },
    setCompletion: '#0891B2',
  },
  {
    id: 'light_rosewood',
    name: 'Rosewood',
    colors: { ...LIGHT_COLORS, background: '#E8DAD8', surface: '#F5ECEA', surfaceLight: '#EDDEDB', border: '#D3BDB9', accent: '#A33A3A', accentDim: 'rgba(163, 58, 58, 0.14)' },
    gradients: { ...LIGHT_GRADIENTS, background: ['#E8DAD8', '#E8DAD8'], surface: ['#F5ECEA', '#EEE0DD'], surfaceElevated: ['#FAF6F5', '#E5D3CF'], accent: ['#A33A3A', '#7F2D2D'], primaryButton: ['#0B0505', '#251010'], chipSelected: ['#EBC7C3', '#DFB0AA'] },
    setCompletion: '#A33A3A',
  },
  {
    id: 'light_mint',
    name: 'Mint',
    colors: { ...LIGHT_COLORS, background: '#DCE8E2', surface: '#EEF6F2', surfaceLight: '#E1EEE8', border: '#C0D4CA', accent: '#047857', accentDim: 'rgba(4, 120, 87, 0.14)' },
    gradients: { ...LIGHT_GRADIENTS, background: ['#DCE8E2', '#DCE8E2'], surface: ['#EEF6F2', '#E5F0EA'], surfaceElevated: ['#F7FAF8', '#D9E9E1'], accent: ['#047857', '#065F46'], primaryButton: ['#03100B', '#0C241A'], chipSelected: ['#C8E8DA', '#AFE0CC'] },
    setCompletion: '#047857',
  },
  {
    id: 'light_steel',
    name: 'Steel',
    colors: { ...LIGHT_COLORS, background: '#DCE2E7', surface: '#F0F3F6', surfaceLight: '#E3E9EE', border: '#C1CBD5', accent: '#1D4ED8', accentDim: 'rgba(29, 78, 216, 0.14)' },
    gradients: { ...LIGHT_GRADIENTS, background: ['#DCE2E7', '#DCE2E7'], surface: ['#F0F3F6', '#E7EDF2'], surfaceElevated: ['#F8FAFC', '#DCE5EE'], accent: ['#1D4ED8', '#1E40AF'], primaryButton: ['#03070B', '#101A24'], chipSelected: ['#C8D8F4', '#AEC4EA'] },
    setCompletion: '#1D4ED8',
  },
];

export const DEFAULT_THEME = THEMES[0];

export const THEME_MAP: Record<string, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
);
