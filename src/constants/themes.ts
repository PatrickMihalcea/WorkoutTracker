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
  accent: readonly [string, string];
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
      // App-level page background (tab roots, full-screen views, behind cards/modals)
      background: '#000000',
      // Base card/surface background used by most containers
      surface: '#111111',
      // Elevated/interactive surface tint (secondary buttons, selected rows, subtle fills)
      surfaceLight: '#1A1A1A',
      // Primary foreground text color
      text: '#FFFFFF',
      // Secondary text and supporting labels
      textSecondary: '#ffffffcd',
      // Tertiary/de-emphasized text, hints, metadata
      textMuted: '#464444',
      // Universal stroke/divider color (card borders, separators, input outlines)
      border: '#2A2A2A',
      // Main accent brand color (links, active states, badges, highlights)
      accent: '#43E0D3',
      // Soft accent wash for chips/selected backgrounds and low-emphasis accent fills
      accentDim: 'rgba(67, 224, 211, 0.16)',
    },
    gradients: {
      // Full-screen background gradient (currently flat black in default)
      background: ['#000000', '#000000'],
      // Default card gradient for <Card /> when no override is provided
      surface: ['#141414', '#0F0F0F'],
      // Elevated card/sheet gradient used where extra depth is needed
      surfaceElevated: ['#1D1D1D', '#151515'],
      // Accent gradient used for high-emphasis accents (today hero, active routine/week, accent buttons)
      accent: ['#2A7A74', '#2A7A74'],
      // Primary (light) button gradient used by Button variant="primary"
      primaryButton: ['#FFFFFF', '#EAFBF9'],
      // Selected chip gradient fallback for ChipPicker selected state
      chipSelected: ['#ffffff', '#ffffff'],
    },
    // Exercise completion overlay tint in workout cards when a movement is fully completed
    setCompletion: '#43E0D3',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      background: '#000000',
      surface: '#111111',
      surfaceLight: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#FFFFFF',
      textMuted: '#464444',
      border: '#2A2A2A',
      accent: '#38BDF8',
      accentDim: 'rgba(56, 189, 248, 0.16)',
    },
    gradients: {
      background: ['#000000', '#000000'],
      surface: ['#141414', '#0F0F0F'],
      surfaceElevated: ['#1B2025', '#14181C'],
      accent: ['#1A5E86', '#1A5E86'],
      primaryButton: ['#FFFFFF', '#E8F7FF'],
      chipSelected: ['#ffffff', '#ffffff'],
    },
    setCompletion: '#38BDF8',
  },
  {
    id: 'fire',
    name: 'Fire',
    colors: {
      background: '#000000',
      surface: '#111111',
      surfaceLight: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#FFFFFF',
      textMuted: '#464444',
      border: '#2A2A2A',
      accent: '#FF7A45',
      accentDim: 'rgba(255, 122, 69, 0.16)',
    },
    gradients: {
      background: ['#000000', '#000000'],
      surface: ['#141414', '#0F0F0F'],
      surfaceElevated: ['#1F1B19', '#171413'],
      accent: ['#8B3C1B', '#8B3C1B'],
      primaryButton: ['#FFFFFF', '#FFF0E8'],
      chipSelected: ['#ffffff', '#ffffff'],
    },
    setCompletion: '#FF7A45',
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      background: '#000000',
      surface: '#111111',
      surfaceLight: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#FFFFFF',
      textMuted: '#464444',
      border: '#2A2A2A',
      accent: '#6DD47E',
      accentDim: 'rgba(109, 212, 126, 0.16)',
    },
    gradients: {
      background: ['#000000', '#000000'],
      surface: ['#141714', '#101210'],
      surfaceElevated: ['#1B201B', '#141714'],
      accent: ['#336B3A', '#336B3A'],
      primaryButton: ['#FFFFFF', '#EDF9EF'],
      chipSelected: ['#ffffff', '#ffffff'],
    },
    setCompletion: '#6DD47E',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    colors: {
      background: '#000000',
      surface: '#111111',
      surfaceLight: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#FFFFFF',
      textMuted: '#464444',
      border: '#2A2A2A',
      accent: '#B388FF',
      accentDim: 'rgba(179, 136, 255, 0.16)',
    },
    gradients: {
      background: ['#000000', '#000000'],
      surface: ['#15131A', '#100F14'],
      surfaceElevated: ['#1D1A24', '#15131A'],
      accent: ['#5A3B8C', '#5A3B8C'],
      primaryButton: ['#FFFFFF', '#F2EAFF'],
      chipSelected: ['#ffffff', '#ffffff'],
    },
    setCompletion: '#B388FF',
  },
  {
    id: 'gold',
    name: 'Gold',
    colors: {
      background: '#000000',
      surface: '#111111',
      surfaceLight: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#FFFFFF',
      textMuted: '#464444',
      border: '#2A2A2A',
      accent: '#F6C453',
      accentDim: 'rgba(246, 196, 83, 0.16)',
    },
    gradients: {
      background: ['#000000', '#000000'],
      surface: ['#141414', '#0F0F0F'],
      surfaceElevated: ['#1F1D19', '#171614'],
      accent: ['#7A591A', '#7A591A'],
      primaryButton: ['#FFFFFF', '#FFF6DD'],
      chipSelected: ['#ffffff', '#ffffff'],
    },
    setCompletion: '#F6C453',
  },
  {
    id: 'cherry',
    name: 'Cherry',
    colors: {
      background: '#000000',
      surface: '#111111',
      surfaceLight: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#FFFFFF',
      textMuted: '#464444',
      border: '#2A2A2A',
      accent: '#F472A6',
      accentDim: 'rgba(244, 114, 166, 0.16)',
    },
    gradients: {
      background: ['#000000', '#000000'],
      surface: ['#141414', '#0F0F0F'],
      surfaceElevated: ['#1F1A1D', '#171315'],
      accent: ['#7A2650', '#7A2650'],
      primaryButton: ['#FFFFFF', '#FFE8F0'],
      chipSelected: ['#ffffff', '#ffffff'],
    },
    setCompletion: '#F472A6',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    colors: {
      background: '#000000',
      surface: '#111111',
      surfaceLight: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#FFFFFF',
      textMuted: '#464444',
      border: '#2A2A2A',
      accent: '#7DDCF2',
      accentDim: 'rgba(125, 220, 242, 0.16)',
    },
    gradients: {
      background: ['#000000', '#000000'],
      surface: ['#141414', '#0F0F0F'],
      surfaceElevated: ['#1B2023', '#14181A'],
      accent: ['#356C79', '#356C79'],
      primaryButton: ['#FFFFFF', '#EAFBFF'],
      chipSelected: ['#ffffff', '#ffffff'],
    },
    setCompletion: '#7DDCF2',
  },
  {
    id: 'void',
    name: 'Void',
    colors: {
      background: '#000000',
      surface: '#111111',
      surfaceLight: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#FFFFFF',
      textMuted: '#464444',
      border: '#2A2A2A',
      accent: '#A3A3A3',
      accentDim: 'rgba(163, 163, 163, 0.16)',
    },
    gradients: {
      background: ['#000000', '#000000'],
      surface: ['#141414', '#0F0F0F'],
      surfaceElevated: ['#1B1B1B', '#141414'],
      accent: ['#525252', '#525252'],
      primaryButton: ['#FFFFFF', '#ECECEC'],
      chipSelected: ['#ffffff', '#ffffff'],
    },
    setCompletion: '#A3A3A3',
  },
];

export const DEFAULT_THEME = THEMES[0];

export const THEME_MAP: Record<string, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
);
