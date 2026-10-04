import type { ElementalSpell } from '../../data/elementalSpells';

export type CombatSpellAnchor = 'caster' | 'target';

export interface CombatSpellPresentation {
  anchor: CombatSpellAnchor;
  scale: number;
  travelPixels: number;
}

const SELF_ACTIONS = new Set<ElementalSpell['action']>([
  'transform', 'shield', 'restore', 'cleanse', 'cloak', 'levitate', 'rewind', 'teleport',
]);

export function isCombatSupportSpell(spell: ElementalSpell): boolean {
  return SELF_ACTIONS.has(spell.action)
    || ['restore', 'shield', 'mobility', 'transform'].includes(spell.castType);
}

export function isTargetCenteredCombatSpell(spell: ElementalSpell): boolean {
  if (SELF_ACTIONS.has(spell.action) || spell.target === 'self') return false;
  // Area spells are ground-targeted in combat even when the open-world effect
  // was authored to originate from the caster (for example Still Second).
  if (spell.target === 'area') return true;
  return spell.effectOrigin !== 'self';
}

/** Radius in combat-engine world units. One unit is roughly one fighter width. */
export function getCombatSpellHitRadius(spell: ElementalSpell): number {
  if (spell.target === 'area') return Math.max(1.05, Math.min(1.8, (spell.radius ?? 135) / 100));
  if (spell.castType === 'summon') return 1.05;
  if (spell.target === 'nearest') return 0.95;
  return 0.78;
}

/**
 * Maps semantic spell behavior to a stable fighting-game stage transform.
 * Projectile effects launch at the caster; traps and impacts are centered on
 * the opponent; defensive and mobility effects stay on the caster.
 */
export function getCombatSpellPresentation(
  spell: ElementalSpell,
  casterX: number,
  targetX: number,
): CombatSpellPresentation {
  const targetCentered = isTargetCenteredCombatSpell(spell);
  const selfEffect = !targetCentered && (spell.target === 'self'
    || SELF_ACTIONS.has(spell.action)
    || spell.effectOrigin === 'self');
  const travelPixels = Math.max(72, Math.abs(targetX - casterX));

  if (spell.action === 'teleport') {
    return { anchor: 'caster', scale: 1.08, travelPixels };
  }
  if (selfEffect) {
    const isProjectile = spell.effectOrigin === 'self'
      && spell.target !== 'self'
      && !SELF_ACTIONS.has(spell.action);
    return {
      anchor: 'caster',
      scale: isProjectile ? Math.max(0.94, Math.min(1.18, travelPixels / 345)) : 1.02,
      travelPixels,
    };
  }
  return {
    anchor: 'target',
    scale: spell.castType === 'summon' ? 1.12 : spell.target === 'area' ? 1.08 : 1.04,
    travelPixels,
  };
}
