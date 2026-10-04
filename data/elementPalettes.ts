import type { ElementType } from '../types';

export interface ElementPalette {
  name: string;
  primary: string;
  body?: string;
  secondary: string;
  accent: string;
  eye: string;
  roughness: number;
  metalness: number;
  emission: number;
}

/** Character identity colors. Spell surfaces retain their own authored materials. */
export const ELEMENT_PALETTES: Record<ElementType, ElementPalette> = {
  fire: { name: 'Ember scarlet', primary: '#EA402E', secondary: '#FFAB58', accent: '#FFC975', eye: '#FFF1C9', roughness: .65, metalness: .1, emission: .2 },
  water: { name: 'Ocean blue', primary: '#237BD9', secondary: '#51C7EA', accent: '#126080', eye: '#E0FAFF', roughness: .12, metalness: .05, emission: .16 },
  lightning: { name: 'Electric lemon', primary: '#EEDB24', secondary: '#FFF38B', accent: '#765714', eye: '#FFFFDA', roughness: .3, metalness: .2, emission: .2 },
  ice: { name: 'Glacier cyan', primary: '#B5EEFA', secondary: '#679DCB', accent: '#DAF8FF', eye: '#EAFBFF', roughness: .2, metalness: .05, emission: .12 },
  wind: { name: 'Zephyr jade', primary: '#42DCAE', secondary: '#B2F4D9', accent: '#247D68', eye: '#E6FFF3', roughness: .45, metalness: .03, emission: .16 },
  soil: { name: 'Sandstone', primary: '#B7976D', secondary: '#6C513D', accent: '#E3C99D', eye: '#FAE5BB', roughness: .9, metalness: .03, emission: .08 },
  trees: { name: 'Cedar bark', primary: '#6E442B', secondary: '#65B842', accent: '#A3D85A', eye: '#080604', roughness: .95, metalness: 0, emission: .1 },
  dark: { name: 'Grave charcoal and bone', primary: '#343D48', secondary: '#D1C9B8', accent: '#8CACA2', eye: '#C8D9CA', roughness: .85, metalness: .03, emission: .12 },
  light: { name: 'Solar ivory', primary: '#FFF3D8', secondary: '#D3A43D', accent: '#FFE9AA', eye: '#FFFEF1', roughness: .35, metalness: .1, emission: .08 },
  space: { name: 'Cosmic indigo', primary: '#4245A7', secondary: '#A79CFF', accent: '#EC9DD6', eye: '#ECEAFF', roughness: .45, metalness: .15, emission: .18 },
  time: { name: 'Copper patina', primary: '#24958E', secondary: '#D79B50', accent: '#EFCF91', eye: '#FFF0CD', roughness: .48, metalness: .3, emission: .14 },
  robot: { name: 'Titanium silver', primary: '#92A2B0', secondary: '#37DFEA', accent: '#455562', eye: '#83FFFF', roughness: .3, metalness: .8, emission: .06 },
  healing: { name: 'Blossom rose', primary: '#E9699C', secondary: '#F7BDCD', accent: '#87C99B', eye: '#FFF0F5', roughness: .65, metalness: .02, emission: .12 },
  void: { name: 'Abyssal obsidian', primary: '#B84168', body: '#271B33', secondary: '#DB6388', accent: '#BDA5DB', eye: '#EDD9FF', roughness: .5, metalness: .15, emission: .22 },
};

function rgba(hex: string, alpha: number, shade = 1) {
  const channels = [1, 3, 5].map(offset => Math.round(parseInt(hex.slice(offset, offset + 2), 16) * shade));
  return `rgba(${channels.join(', ')}, ${alpha})`;
}

export function getElementIdentityColors(element: ElementType) {
  const palette = ELEMENT_PALETTES[element];
  return {
    primaryColor: palette.primary,
    bodyColor: palette.body ?? palette.primary,
    secondaryColor: palette.secondary,
    glowColor: rgba(palette.primary, .65),
    shadowColor: rgba(palette.primary, .9, .22),
  };
}

export function getElementUIColors(element: ElementType) {
  const palette = ELEMENT_PALETTES[element];
  return { primary: palette.primary, secondary: palette.secondary,
    glow: rgba(palette.primary, .4), bg: rgba(palette.primary, 1, .08) };
}
