import { ElementType } from '../types';
import { ELEMENT_PALETTES } from '../data/elementPalettes';

export interface ThemeConfig {
  id: string;
  name: string;
  label: string;
  bgGradient: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  subtextColor: string;
  cardBg: string;
  cardBorder: string;
  particleColor: string;
  glowColor: string;
}

export const THEMES: Record<ElementType, ThemeConfig> = {
  fire: {
    id: 'fire',
    name: 'Ignis',
    label: 'Fire Realm',
    bgGradient: 'radial-gradient(ellipse at 60% 20%, #3a0a00 0%, #1a0500 50%, #060204 100%)',
    primaryColor: '#FF3000',
    secondaryColor: '#FF6600',
    accentColor: '#FF9900',
    textColor: '#FFF0E0',
    subtextColor: '#FFB899',
    cardBg: 'rgba(36, 10, 4, 0.75)',
    cardBorder: 'rgba(255, 80, 0, 0.28)',
    particleColor: '#FF5000',
    glowColor: 'rgba(255, 60, 0, 0.4)',
  },
  water: {
    id: 'water',
    name: 'Marina',
    label: 'Ocean Depths',
    bgGradient: 'radial-gradient(ellipse at 40% 80%, #001840 0%, #000d2a 50%, #03050d 100%)',
    primaryColor: '#00AAFF',
    secondaryColor: '#0066CC',
    accentColor: '#40C8FF',
    textColor: '#E0F4FF',
    subtextColor: '#99CCFF',
    cardBg: 'rgba(0, 20, 50, 0.75)',
    cardBorder: 'rgba(0, 160, 255, 0.28)',
    particleColor: '#0088DD',
    glowColor: 'rgba(0, 140, 255, 0.4)',
  },
  ice: {
    id: 'ice',
    name: 'Glacies',
    label: 'Frozen Expanse',
    bgGradient: 'radial-gradient(ellipse at 50% 10%, #0a1a2a 0%, #050d18 60%, #020509 100%)',
    primaryColor: '#80F0FF',
    secondaryColor: '#C8F8FF',
    accentColor: '#A8F8FF',
    textColor: '#EEF8FF',
    subtextColor: '#80D8F0',
    cardBg: 'rgba(5, 22, 36, 0.75)',
    cardBorder: 'rgba(128, 240, 255, 0.28)',
    particleColor: '#60D8F0',
    glowColor: 'rgba(100, 220, 250, 0.35)',
  },
  wind: {
    id: 'wind',
    name: 'Ventus',
    label: 'Sky Currents',
    bgGradient: 'radial-gradient(ellipse at 70% 30%, #102010 0%, #081208 60%, #020603 100%)',
    primaryColor: '#00E676',
    secondaryColor: '#B9F6CA',
    accentColor: '#69F0AE',
    textColor: '#F2FFF6',
    subtextColor: '#9CE7B8',
    cardBg: 'rgba(6, 28, 14, 0.75)',
    cardBorder: 'rgba(0, 230, 118, 0.28)',
    particleColor: '#00E676',
    glowColor: 'rgba(0, 230, 118, 0.35)',
  },
  soil: {
    id: 'soil',
    name: 'Terra',
    label: 'Ancient Earth',
    bgGradient: 'radial-gradient(ellipse at 30% 70%, #261205 0%, #140802 60%, #070301 100%)',
    primaryColor: '#FF6D00',
    secondaryColor: '#FFD180',
    accentColor: '#FF9E40',
    textColor: '#FFF4EA',
    subtextColor: '#DDB690',
    cardBg: 'rgba(30, 15, 6, 0.75)',
    cardBorder: 'rgba(255, 109, 0, 0.28)',
    particleColor: '#FF6D00',
    glowColor: 'rgba(255, 109, 0, 0.35)',
  },
  trees: {
    id: 'trees',
    name: 'Groot',
    label: 'Flora Colossus Grove',
    bgGradient: 'radial-gradient(ellipse at 40% 60%, #1a1008 0%, #0d0703 60%, #030201 100%)',
    primaryColor: '#8D5524',
    secondaryColor: '#4ADE80',
    accentColor: '#86EFAC',
    textColor: '#F5EFE6',
    subtextColor: '#C7B299',
    cardBg: 'rgba(26, 16, 8, 0.78)',
    cardBorder: 'rgba(141, 85, 36, 0.38)',
    particleColor: '#4ADE80',
    glowColor: 'rgba(74, 222, 128, 0.38)',
  },
  lightning: {
    id: 'lightning',
    name: 'Volt',
    label: 'Storm Peak',
    bgGradient: 'radial-gradient(ellipse at 80% 20%, #221c00 0%, #120e00 60%, #060400 100%)',
    primaryColor: '#FFD600',
    secondaryColor: '#FFFF55',
    accentColor: '#FFE57F',
    textColor: '#FFFDE5',
    subtextColor: '#E5D678',
    cardBg: 'rgba(28, 24, 4, 0.75)',
    cardBorder: 'rgba(255, 214, 0, 0.32)',
    particleColor: '#FFD600',
    glowColor: 'rgba(255, 214, 0, 0.45)',
  },
  dark: {
    id: 'dark',
    name: 'Umbra',
    label: 'Shadow Realm',
    bgGradient: 'radial-gradient(ellipse at 50% 50%, #240038 0%, #12001c 60%, #06000a 100%)',
    primaryColor: '#9C27B0',
    secondaryColor: '#EA80FC',
    accentColor: '#BA68C8',
    textColor: '#F8E8FF',
    subtextColor: '#D1A3E2',
    cardBg: 'rgba(26, 4, 38, 0.75)',
    cardBorder: 'rgba(156, 39, 176, 0.32)',
    particleColor: '#BA68C8',
    glowColor: 'rgba(156, 39, 176, 0.4)',
  },
  light: {
    id: 'light',
    name: 'Luma',
    label: 'Radiant Realm',
    bgGradient: 'radial-gradient(ellipse at 50% 20%, #242200 0%, #121100 60%, #060500 100%)',
    primaryColor: '#FFD700',
    secondaryColor: '#FFF9C4',
    accentColor: '#FFE082',
    textColor: '#FFFFF8',
    subtextColor: '#E2D996',
    cardBg: 'rgba(32, 30, 4, 0.75)',
    cardBorder: 'rgba(255, 215, 0, 0.32)',
    particleColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.5)',
  },
  space: {
    id: 'space',
    name: 'Cosmus',
    label: 'The Cosmos',
    bgGradient: 'radial-gradient(ellipse at 50% 50%, #28001a 0%, #14000d 60%, #060004 100%)',
    primaryColor: '#F50057',
    secondaryColor: '#FF80AB',
    accentColor: '#FF4081',
    textColor: '#FFEAF2',
    subtextColor: '#DCA2BA',
    cardBg: 'rgba(32, 2, 20, 0.75)',
    cardBorder: 'rgba(245, 0, 87, 0.28)',
    particleColor: '#F50057',
    glowColor: 'rgba(245, 0, 87, 0.4)',
  },
  time: {
    id: 'time',
    name: 'Chrono',
    label: 'The Timestream',
    bgGradient: 'radial-gradient(ellipse at 50% 50%, #201200 0%, #100900 60%, #050300 100%)',
    primaryColor: '#FF9100',
    secondaryColor: '#FFE57F',
    accentColor: '#FFB74D',
    textColor: '#FFF6EB',
    subtextColor: '#E0BA88',
    cardBg: 'rgba(28, 16, 2, 0.75)',
    cardBorder: 'rgba(255, 145, 0, 0.28)',
    particleColor: '#FF9100',
    glowColor: 'rgba(255, 145, 0, 0.4)',
  },
  robot: {
    id: 'robot',
    name: 'Nexus',
    label: 'Digital Core',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, #081622 0%, #040c14 60%, #010408 100%)',
    primaryColor: '#00E5FF',
    secondaryColor: '#B2EBF2',
    accentColor: '#4DD0E1',
    textColor: '#E8FDFF',
    subtextColor: '#91C4CC',
    cardBg: 'rgba(4, 20, 32, 0.75)',
    cardBorder: 'rgba(0, 229, 255, 0.28)',
    particleColor: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.35)',
  },
  healing: {
    id: 'healing',
    name: 'Aura',
    label: 'Healing Grounds',
    bgGradient: 'radial-gradient(ellipse at 50% 40%, #260515 0%, #14020a 60%, #060103 100%)',
    primaryColor: '#FF4081',
    secondaryColor: '#F8BBD0',
    accentColor: '#FF80AB',
    textColor: '#FFF0F5',
    subtextColor: '#D89BAE',
    cardBg: 'rgba(32, 4, 16, 0.75)',
    cardBorder: 'rgba(255, 64, 129, 0.28)',
    particleColor: '#FF4081',
    glowColor: 'rgba(255, 64, 129, 0.35)',
  },
  void: {
    id: 'void',
    name: 'Nihil',
    label: 'The Void',
    bgGradient: 'radial-gradient(ellipse at 50% 50%, #160007 0%, #0c0004 60%, #040001 100%)',
    primaryColor: '#880033',
    secondaryColor: '#FF2266',
    accentColor: '#FF5588',
    textColor: '#FBE8EE',
    subtextColor: '#C47088',
    cardBg: 'rgba(22, 2, 8, 0.82)',
    cardBorder: 'rgba(136, 0, 51, 0.38)',
    particleColor: '#880033',
    glowColor: 'rgba(136, 0, 51, 0.45)',
  },
};

export type ThemeMode = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'portfolio-theme';

export function applyThemeVariables(element: ElementType, mode: ThemeMode = 'dark', elementalAccent = true) {
  if (typeof document === 'undefined') return;

  const realm = THEMES[element];
  const root = document.documentElement;
  const palette = ELEMENT_PALETTES[element];
  const light = mode === 'light';
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  // Neutral surfaces belong to the mode; a selected companion owns the accents.
  const mix = (color: string, base: string, weight: number) =>
    `color-mix(in srgb, ${color} ${weight}%, ${base})`;
  const folioVariables = {
    bg: light ? '#f7f7f5' : '#121212',
    surface: light ? '#ffffff' : '#1c1c1c',
    text: light ? '#202020' : '#eeeeec',
    muted: light ? '#555555' : '#aaaaaa',
    line: light ? '#cececc' : '#363636',
    accent: elementalAccent ? mix(palette.primary, light ? '#171717' : '#ffffff', light ? 38 : 65) : light ? '#292929' : '#dededb',
    secondary: elementalAccent ? (light ? mix(palette.secondary, '#171717', 38) : palette.secondary) : light ? '#454545' : '#c5c5c5',
  };
  Object.entries(folioVariables).forEach(([key, value]) => {
    root.style.setProperty(`--folio-${key}`, value);
  });
  const config = {
    ...realm,
    bgGradient: `radial-gradient(ellipse at 50% 20%, ${folioVariables.surface}, ${folioVariables.bg} 70%)`,
    primaryColor: folioVariables.accent,
    secondaryColor: folioVariables.secondary,
    accentColor: folioVariables.accent,
    textColor: folioVariables.text,
    subtextColor: folioVariables.muted,
    cardBg: folioVariables.surface,
    cardBorder: folioVariables.line,
    glowColor: mix(folioVariables.accent, 'transparent', 40),
  };

  root.style.setProperty('--theme-bg', config.bgGradient);
  root.style.setProperty('--theme-primary', config.primaryColor);
  root.style.setProperty('--theme-secondary', config.secondaryColor);
  root.style.setProperty('--theme-accent', config.accentColor);
  root.style.setProperty('--theme-text', config.textColor);
  root.style.setProperty('--theme-subtext', config.subtextColor);
  root.style.setProperty('--theme-card-bg', config.cardBg);
  root.style.setProperty('--theme-card-border', config.cardBorder);
  root.style.setProperty('--theme-glow', config.glowColor);

  // Legacy compat aliases
  root.style.setProperty('--color-primary', config.primaryColor);
  root.style.setProperty('--color-secondary', config.secondaryColor);
  root.style.setProperty('--color-glow', config.glowColor);
  root.style.setProperty('--color-shadow', config.glowColor);
  root.style.setProperty('--active-element', element);
}
