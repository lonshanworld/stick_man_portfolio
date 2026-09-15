/** Spells earn their climax through their own silhouette instead of a shared rune overlay. */
const ULTIMATE_SPELLS = new Set([
  'fire-dragon-meteor',
  'water-oceanic-geyser',
  'lightning-chain-nova',
  'ice-absolute-zero',
  'wind-aero-burst',
  'soil-fortress-bastion',
  'trees-ironwood-slam',
  'dark-eclipse-nova',
  'light-supernova-flare',
  'space-planetary-rings',
  'time-stasis-field',
  'robot-missile-salvo',
  'healing-vitality-rain',
  'void-catastrophic-collapse',
]);

export const isUltimateSpell = (id: string) => ULTIMATE_SPELLS.has(id);
