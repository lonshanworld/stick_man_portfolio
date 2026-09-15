import { ElementType } from '../types';
import { STICK_MAN_ARCHETYPES } from './stickManArchetypes';

export const ELEMENT_COLORS: Record<ElementType, { primary: string; secondary: string; glow: string; bg: string }> = {
  fire: { primary: '#FF3B00', secondary: '#FFAE00', glow: 'rgba(255, 59, 0, 0.4)', bg: '#170603' },
  water: { primary: '#00B4D8', secondary: '#90E0EF', glow: 'rgba(0, 180, 216, 0.4)', bg: '#031219' },
  lightning: { primary: '#FFD60A', secondary: '#FFF3B0', glow: 'rgba(255, 214, 10, 0.4)', bg: '#181502' },
  ice: { primary: '#48CAE4', secondary: '#CAF0F8', glow: 'rgba(72, 202, 228, 0.4)', bg: '#04151c' },
  wind: { primary: '#52B788', secondary: '#B7E4C7', glow: 'rgba(82, 183, 136, 0.4)', bg: '#04170d' },
  soil: { primary: '#DDA15E', secondary: '#BC6C25', glow: 'rgba(221, 161, 94, 0.4)', bg: '#191107' },
  trees: { primary: '#7A4B26', secondary: '#4ADE80', glow: 'rgba(74, 222, 128, 0.4)', bg: '#140c06' },
  dark: { primary: '#9D4EDD', secondary: '#C77DFF', glow: 'rgba(157, 78, 221, 0.4)', bg: '#13041d' },
  light: { primary: '#FFD166', secondary: '#FFF1C5', glow: 'rgba(255, 209, 102, 0.4)', bg: '#181506' },
  space: { primary: '#F72585', secondary: '#B5179E', glow: 'rgba(247, 37, 133, 0.4)', bg: '#190312' },
  time: { primary: '#E0A96D', secondary: '#ECC59B', glow: 'rgba(224, 169, 109, 0.4)', bg: '#171109' },
  robot: { primary: '#00F5D4', secondary: '#7B2CBF', glow: 'rgba(0, 245, 212, 0.4)', bg: '#031714' },
  healing: { primary: '#FF70A6', secondary: '#FF9770', glow: 'rgba(255, 112, 166, 0.4)', bg: '#19060f' },
  void: { primary: '#880033', secondary: '#FF2266', glow: 'rgba(136, 0, 51, 0.4)', bg: '#140107' },
};

export function getStickManDefinition(element: ElementType) {
  return STICK_MAN_ARCHETYPES[element] || STICK_MAN_ARCHETYPES.fire;
}
