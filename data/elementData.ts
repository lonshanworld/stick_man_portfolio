import { ElementType } from '../types';
import { STICK_MAN_ARCHETYPES } from './stickManArchetypes';
import { ELEMENT_PALETTES, getElementUIColors } from './elementPalettes';

export const ELEMENT_COLORS = Object.fromEntries(
  (Object.keys(ELEMENT_PALETTES) as ElementType[]).map(element => [element, getElementUIColors(element)])
) as Record<ElementType, ReturnType<typeof getElementUIColors>>;

export function getStickManDefinition(element: ElementType) {
  return STICK_MAN_ARCHETYPES[element] || STICK_MAN_ARCHETYPES.fire;
}
