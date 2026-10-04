import type { ElementalSpell } from '../../data/elementalSpells';
import type { ElementType } from '../../types';

// Ability portraits use the same silhouettes as their 3D effects, rather than platform emoji.
const GLYPHS: Record<string, string> = {
  'fire-phoenix-firestorm': 'M16 27c-4-5-3-9 0-14 3 5 4 9 0 14ZM14 17C8 17 3 9 3 5c5 4 8 3 12 9M18 17c6 0 11-8 11-12-5 4-8 3-12 9M5 12l4 9 4-2M27 12l-4 9-4-2M16 13V7l3-2-1 5M13 27l-2 3M19 27l2 3',
  'fire-pyroclastic-surge': 'M25 7c5 5 1 12-5 10-4-1-5-6-2-9l7-1ZM18 10 8 3l4 10M20 16 7 11l6 8M19 24c3 4-1 7-4 5-3-2-2-5 1-6l3 1ZM14 25 4 20l5 7',
  'fire-dragon-meteor': 'M26 3 16 12M29 8 23 15M19 4 10 12M8 14l8-3 7 5-2 8-8 3-7-6 2-7ZM10 16l5 2 3-3M15 18l-2 5M3 29c7-3 19-3 26 0M5 26l-3-4M27 25l3-4',
  'water-tidal-surge': 'M3 25c6 0 8-5 8-11C11 4 25 2 28 13c-7-5-14 3-9 8M3 29h26M7 24c5 0 5-8 9-10M19 7l3 1M24 10l2 2M23 24l3-2',
  'water-whirlpool-vortex': 'M16 3c-9 0-12 7-12 13s3 13 12 13 12-7 12-13S25 3 16 3ZM9 11c5-6 12-2 13 3M23 21c-5 6-12 2-13-3M16 8c4 4 5 7 1 10-4-1-5-5-1-10ZM6 16h2M24 16h2',
  'water-oceanic-geyser': 'M4 28c5-4 19-4 24 0M16 25V8M16 9c-8-7-15 3-9 10M16 9c8-7 15 3 9 10M10 18c-3 4-2 7 0 7s3-3 0-7ZM23 18c-3 4-2 7 0 7s3-3 0-7ZM13 4h6',
  'lightning-thunderbolt': 'M17 2l-4 9 6 3-8 15M13 11 6 7l-2 5M19 14l8-6 2 3M14 24l-8 2M10 29l-4 1M14 29l5 1',
  'lightning-plasma-railgun': 'M3 8l9 2-3 4 14-1-3 4 9-2M5 19l6 2-3 3 15-1M23 9l6 6-6 5M23 20l6 3-6 5',
  'lightning-chain-nova': 'M16 3l11 7v12l-11 7-11-7V10L16 3ZM7 11l6 3-3 3 8 1-2 4 9-2M16 3l-2 8M5 22l8-1M27 10l-7 5M16 29l3-9M14 14l2-3 2 3-2 3-2-3Z',
  'ice-glacial-spikes': 'M3 28h26M5 28 3 19l4-4 4 4-1 9M11 28 10 11l6-8 6 8-1 17M23 28l-1-11 4-5 4 5-2 11M16 3v25M10 11l6 3 6-3M3 19l4 2 4-2M22 17l4 2 4-2',
  'ice-blizzard-vortex': 'M16 3 27 9v14l-11 6L5 23V9L16 3ZM16 7l7 4v10l-7 4-7-4V11l7-4ZM16 10v12M11 13l10 6M11 19l10-6M14 11l2 2 2-2M14 21l2-2 2 2',
  'ice-absolute-zero': 'M3 27 4 14l4-5 4 5-1 13M21 27l-1-13 4-5 4 5 1 13M11 26l5 3 5-3M12 10l4-5 4 5M16 12v12M11 15l10 6M11 21l10-6M14 13l2 2 2-2M14 23l2-2 2 2',
  'wind-tornado-gale': 'M3 6C9 2 27 3 29 7S12 15 5 11M6 14c6 4 19 1 20-2M9 18c5 3 13 1 15-1M12 22c4 2 7 0 8-1M15 25l2 4M3 25l5-2M25 23l4-2',
  'wind-zephyr-blades': 'M3 25C5 9 18 2 29 4 16 9 9 17 3 25ZM9 28c3-8 12-15 20-15M17 27c2-4 7-7 12-8M3 10h6M2 15h4',
  'wind-aero-burst': 'M16 25V4M11 10l5-6 5 6M8 21c-9-8 0-13 4-7M24 21c9-8 0-13-4-7M3 25c6 5 20 5 26 0M6 28h20M10 22c-3-3-2-5 0-6M22 22c3-3 2-5 0-6',
  'soil-bedrock-fissure': 'M3 27 9 14l5 11 5-20 7 22M19 5l-2 14 5 2M4 29h25M3 17l5 2M26 9l3 2',
  'soil-boulder-catapult': 'M18 4l8 2 4 7-5 7-9-2-4-7 6-7ZM18 7l3 4-3 5M21 11l6 1M3 24c2-8 5-15 10-18M5 26l5-3M16 27l3-4M23 25l4 3M3 29h26',
  'soil-fortress-bastion': 'M3 28V12l5-3 5 3v16M19 28V12l5-3 5 3v16M3 18h10M3 23h10M19 18h10M19 23h10M13 16h6M13 23h6M8 13l2 3-2 3-2-3 2-3ZM24 13l2 3-2 3-2-3 2-3Z',
  'trees-root-entanglement': 'M16 3v15l-6 5-7 3M16 18l7 4 6 6M16 18l-1 11M16 11C7 13 7 5 7 5c8 0 9 6 9 6ZM16 14c9 2 9-6 9-6-8-1-9 6-9 6Z',
  'trees-spore-bloom': 'M16 28V12M16 16l-7-6M16 19l7-6M16 12c-5-4-4-9 0-10 4 1 5 6 0 10ZM9 10C2 9 2 3 2 3c7 0 9 4 7 7ZM23 13c-2-6 3-10 7-8-1 5-3 8-7 8ZM16 25l-5 4M16 25l5 4M5 19v5M3 21h4',
  'trees-ironwood-slam': 'M5 28V15C5 7 11 4 16 3c5 1 11 4 11 12v13M8 28V15c0-5 4-8 8-9 4 1 8 4 8 9v13M6 18l-4-5M26 18l4-5M10 9 7 4M22 9l3-5',
  'dark-abyssal-grasp': 'M3 27l3-13 6-8-2 13 6 7 6-7-2-13 6 8 3 13M6 14l5 3M26 14l-5 3M13 26h6',
  'dark-phantom-wave': 'M16 13 5 5l-3 13 7-3 3 8 4-4 4 4 3-8 7 3-3-13-11 8ZM12 11l1-5 3 4 3-4 1 5M13 15h1M18 15h1',
  'dark-eclipse-nova': 'M16 12 7 5 2 3l2 16 5-5 4 8M16 12l9-7 5-2-2 16-5-5-4 8M12 10l-2-6 4 3M20 10l2-6-4 3M16 12v15M11 29l5-3 5 3M26 29V17M23 20l3-6 3 6M23 22h6',
  'light-solar-dawn': 'M16 4v3M5 8l3 3M27 8l-3 3M3 19h4M29 19h-4M9 23a8 8 0 1 1 14 0M4 28h24M12 26v4M20 26v4',
  'light-sunburst-lance': 'M5 28 23 10M19 9l8-6-2 9-6-3ZM9 18l-4-3M12 15l-5-3M15 12l-5-3M11 22l3 5M14 19l3 5M17 16l3 5',
  'light-supernova-flare': 'M12 6a4 2 0 1 0 8 0 4 2 0 1 0-8 0M16 10v17M12 17h8M13 12 5 9 3 3l1 16 7 7M19 12l8-3 2-6-1 16-7 7M11 28l5-3 5 3M22 29V16M19 20h6',
  'space-meteor-shower': 'M12 16a4 4 0 1 0 8 0 4 4 0 1 0-8 0ZM3 17c6-5 20-5 26-2M3 19c8 3 20 3 26-1M7 14c1-12 17-12 18 0M8 22c4 6 12 6 16 0M4 5h1M28 27h1',
  'space-cosmic-ray': 'M8 4C-1 4-1 28 8 28s9-24 0-24ZM8 8c-5 0-5 16 0 16s5-16 0-16ZM24 4c-9 0-9 24 0 24s9-24 0-24ZM24 8c-5 0-5 16 0 16s5-16 0-16ZM11 8l10 16M11 24 21 8',
  'space-planetary-rings': 'M4 4c8 4 16 4 24 0v24c-8-4-16-4-24 0ZM4 12c8 2 16 2 24 0M4 20c8-2 16-2 24 0M12 6v20M20 6v20M14 16a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z',
  'time-chrono-rewind': 'M7 8a12 12 0 1 1-3 13M3 4v8h8M16 8v9l-6 4M16 4v2M28 16h-2M16 28v-2',
  'time-gear-barrage': 'M6 9 5 3l8 5h6l8-5-1 6 2 8-5 10-7 3-7-3-5-10 2-8ZM9 13a3 3 0 1 0 6 0 3 3 0 1 0-6 0ZM17 13a3 3 0 1 0 6 0 3 3 0 1 0-6 0ZM13 20l3 4 3-4M4 14l-2 9 7-2M28 14l2 9-7-2',
  'time-stasis-field': 'M7 4h18M7 28h18M9 4v5l7 7-7 7v5M23 4v5l-7 7 7 7v5M12 8h8M12 25l4-4 4 4M3 12v8M29 12v8',
  'robot-hyper-beam': 'M2 10h7v5H2v-5ZM2 20h7v5H2v-5ZM9 12h13M9 22h13M25 10v14M21 7h8M21 27h8M22 17h7',
  'robot-overclock-grid': 'M3 7h9v6H3V7ZM20 7h9v6h-9V7ZM6 4v3M25 4v3M8 13l5 7M24 13l-5 7M16 17v12M10 23h12M2 15h3M27 15h3',
  'robot-missile-salvo': 'M17 3l5 6-3 10-5-2-2-10 5-4ZM14 17l-4 5 7-2M21 14l4 7-6-2M8 25l-3 4M14 24l-2 5M6 15 3 8l4-3 4 5M25 5l4-2',
  'healing-sakura-sanctuary': 'M16 28C-3 16 3 2 16 10c13-8 19 6 0 18ZM13 12h6v4h4v6h-4v4h-6v-4H9v-6h4Z',
  'healing-petal-breeze': 'M16 9v19M15 14C0 0 0 19 12 20 1 23 8 32 16 25c8 7 15-2 4-5 12-1 12-20-3-6ZM12 3l4 6 4-6M13 19h6M16 16v6',
  'healing-vitality-rain': 'M9 5a5 5 0 0 1 10 0v12a5 5 0 0 1-10 0ZM9 11h10M23 19h7M26.5 15.5v7M4 23h7M7.5 19.5v7',
  'void-singularity-event': 'M9 16a7 7 0 1 0 14 0 7 7 0 1 0-14 0ZM3 21C-3 14 27 6 29 11s-26 14-26 10ZM4 7l3 3M25 23l3 3M16 2v3M16 27v3',
  'void-dimensional-slash': 'M3 4l10 7-1 3 4 1 12 13-13-9 1-3-4-1L3 4ZM3 28l10-7-1-3 4-1L28 4 15 13l1 3-4 1L3 28ZM2 14l3 2-3 3M30 14l-3 2 3 3',
  'void-catastrophic-collapse': 'M16 2l-6 7 2 4-5 6 4 3-2 4 7 4 7-4-2-4 4-3-5-6 2-4-6-7ZM12 13l8 1M10 19l12 1M12 25l8 1M3 9l-1 5M29 21l1 5',
};

const FIRST: Record<ElementType, string> = {
  fire: 'fire-pyroclastic-surge', water: 'water-tidal-surge', lightning: 'lightning-thunderbolt',
  ice: 'ice-absolute-zero', wind: 'wind-tornado-gale', soil: 'soil-bedrock-fissure',
  trees: 'trees-root-entanglement', dark: 'dark-eclipse-nova', light: 'light-solar-dawn',
  space: 'space-planetary-rings', time: 'time-chrono-rewind', robot: 'robot-overclock-grid',
  healing: 'healing-sakura-sanctuary', void: 'void-singularity-event',
};

export function SpellIcon({ spell, size = 24 }: { spell: ElementalSpell; size?: number }) {
  return <ElementSigil element={spell.element} spellId={spell.id} size={size} />;
}

export function ElementSigil({ element, spellId, size = 24 }: { element: ElementType; spellId?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`element-sigil element-sigil-${element}`}>
      <path d={GLYPHS[spellId || FIRST[element]]} />
    </svg>
  );
}
