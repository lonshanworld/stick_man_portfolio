import { ElementType } from '../types';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';

export interface DialogueMessage {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
}

export type DialoguePhase = 'loading' | 'speaking' | 'listening' | 'pause';

export interface StickManEntity {
  id: string;
  element: ElementType;
  name: string;
  title: string;
  dialogueQuote: string;
  specialMove: string;
  homeDistrict: number;
  docX: number; // 0–100% of document width
  docY: number; // 0–100% of total document height
  targetDocX: number;
  targetDocY: number;
  headingAngle: number;
  walkCycle: number;
  state:
    | 'idle'
    | 'walking'
    | 'cheering'
    | 'inspecting'
    | 'rallying'
    | 'talking'
    | 'dueling'
    | 'sitting'
    | 'bullying'
    | 'flying'
    | 'floating';
  speed: number;
  wanderTimer: number;
  personalityOffset: number;
  scaleVariant: number;
  districtName: string;
  waypoints: Array<{ x: number; y: number }>;
  currentWaypointIdx: number;
  isSpeaking: boolean;

  // Open-World Living Game simulation fields
  activeDialogue?: string;
  dialogueNote?: string;
  dialoguePartnerId?: string;
  dialogueSessionId?: string;
  dialoguePhase?: DialoguePhase;
  dialogueTurn?: number;
  dialogueTotalTurns?: number;
  dialogueHistory?: DialogueMessage[];
  encounterTimer?: number;
  encounterState?: 'approaching_duel' | 'approaching_bully' | 'approaching_chat';
  perchId?: string;
  perchCardName?: string;
  perchSide?: 'left' | 'right' | 'center';
  flightPhase?: 'takeoff' | 'cruising' | 'landing';
  flightAltitude?: number;
  floatPhase?: number;
  duelPhase?: 'challenge' | 'cast1' | 'defend1' | 'recoil1' | 'cast2' | 'defend2' | 'recoil2' | 'resolve' | 'finished';
  duelPartnerId?: string;
  duelRole?: 'challenger' | 'defender';
  bullyPhase?: 'sneak' | 'prank' | 'react';
  bullyPartnerId?: string;
}

// Keep overland movement relaxed and readable across every character behavior.
// Individual behaviors can still choose their relative pace through `speed`.
export const STICK_MAN_MOVEMENT_SPEED_SCALE = 0.6;

export const DISTRICT_NAMES = [
  'Sanctuary Plaza (Hero)',
  'Chronicle Courtyard (Experience)',
  'Memory Garden (Projects)',
  'Elemental Archive (Skills)',
  'Astral Citadel (AI Terminal)',
  'Void Portal (Contact)',
];

// Vertical document height bands corresponding to each section
// Hero: ~2% - 14%
// Experience: ~15% - 34%
// Projects: ~35% - 56%
// Skills: ~57% - 74%
// AI Terminal: ~75% - 87%
// Contact: ~88% - 98%
const DISTRICT_BANDS = [
  { min: 3, max: 13 },   // 0: Hero
  { min: 16, max: 32 },  // 1: Experience
  { min: 36, max: 54 },  // 2: Projects
  { min: 58, max: 72 },  // 3: Skills
  { min: 75, max: 85 },  // 4: AI Terminal
  { min: 88, max: 97 },  // 5: Contact
];

export const INITIAL_POPULATION_CONFIG: Array<{
  id: string;
  element: ElementType;
  district: number;
  defaultX: number;
  defaultY: number;
}> = [
  // District 0: Sanctuary Plaza (Hero) - 5 stick men
  { id: 'ignis-hero', element: 'fire', district: 0, defaultX: 18, defaultY: 7 },
  { id: 'zephyr-hero', element: 'wind', district: 0, defaultX: 78, defaultY: 9 },
  { id: 'lumina-hero', element: 'light', district: 0, defaultX: 48, defaultY: 12 },
  { id: 'pulse-hero', element: 'lightning', district: 0, defaultX: 62, defaultY: 6 },
  { id: 'aurora-hero', element: 'healing', district: 0, defaultX: 32, defaultY: 11 },

  // District 1: Chronicle Courtyard (Experience) - 5 stick men
  { id: 'volt-exp', element: 'lightning', district: 1, defaultX: 14, defaultY: 20 },
  { id: 'terra-exp', element: 'soil', district: 1, defaultX: 84, defaultY: 24 },
  { id: 'sylvan-exp', element: 'trees', district: 1, defaultX: 28, defaultY: 30 },
  { id: 'cascade-exp', element: 'water', district: 1, defaultX: 52, defaultY: 22 },
  { id: 'gale-exp', element: 'wind', district: 1, defaultX: 72, defaultY: 28 },

  // District 2: Memory Garden (Projects) - 5 stick men
  { id: 'aqua-proj', element: 'water', district: 2, defaultX: 12, defaultY: 38 },
  { id: 'glacius-proj', element: 'ice', district: 2, defaultX: 86, defaultY: 44 },
  { id: 'robot-proj', element: 'robot', district: 2, defaultX: 34, defaultY: 51 },
  { id: 'flora-proj', element: 'trees', district: 2, defaultX: 22, defaultY: 46 },
  { id: 'dawn-proj', element: 'light', district: 2, defaultX: 68, defaultY: 40 },

  // District 3: Elemental Archive (Skills) - 5 stick men
  { id: 'kage-skill', element: 'dark', district: 3, defaultX: 16, defaultY: 61 },
  { id: 'chronos-skill', element: 'time', district: 3, defaultX: 82, defaultY: 66 },
  { id: 'lotus-skill', element: 'healing', district: 3, defaultX: 46, defaultY: 70 },
  { id: 'mecha-skill', element: 'robot', district: 3, defaultX: 30, defaultY: 64 },
  { id: 'golem-skill', element: 'soil', district: 3, defaultX: 66, defaultY: 62 },

  // District 4: Astral Citadel (AI Terminal) - 4 stick men
  { id: 'void-ai', element: 'void', district: 4, defaultX: 18, defaultY: 78 },
  { id: 'cosmos-ai', element: 'space', district: 4, defaultX: 80, defaultY: 82 },
  { id: 'aeon-ai', element: 'time', district: 4, defaultX: 36, defaultY: 80 },
  { id: 'eclipse-ai', element: 'dark', district: 4, defaultX: 62, defaultY: 83 },

  // District 5: Void Portal (Contact) - 4 stick men
  { id: 'blaze-contact', element: 'fire', district: 5, defaultX: 24, defaultY: 91 },
  { id: 'frost-contact', element: 'ice', district: 5, defaultX: 76, defaultY: 94 },
  { id: 'nebula-contact', element: 'space', district: 5, defaultX: 48, defaultY: 92 },
  { id: 'abyss-contact', element: 'void', district: 5, defaultX: 88, defaultY: 95 },
];

/**
 * Spawns the stick man squad distributed across the entire scrollable website
 */
export function spawnStickManPopulation(): StickManEntity[] {
  return INITIAL_POPULATION_CONFIG.map((cfg, idx) => {
    const def = STICK_MAN_ARCHETYPES[cfg.element] || STICK_MAN_ARCHETYPES.fire;
    const band = DISTRICT_BANDS[cfg.district] || { min: 5, max: 95 };

    // Generate 4-5 patrol waypoints around this district's terrain
    const waypoints: Array<{ x: number; y: number }> = [
      { x: cfg.defaultX, y: cfg.defaultY },
      { x: Math.min(92, Math.max(8, cfg.defaultX + (Math.random() - 0.5) * 45)), y: Math.min(band.max, Math.max(band.min, cfg.defaultY + (Math.random() - 0.5) * 6)) },
      { x: Math.min(92, Math.max(8, (idx % 2 === 0 ? 20 : 75) + (Math.random() - 0.5) * 20)), y: Math.min(band.max, Math.max(band.min, (band.min + band.max) / 2 + (Math.random() - 0.5) * 5)) },
      { x: Math.min(92, Math.max(8, cfg.defaultX + (Math.random() - 0.5) * 30)), y: Math.min(band.max, Math.max(band.min, cfg.defaultY + (Math.random() - 0.5) * 5)) },
    ];

    return {
      id: cfg.id,
      element: cfg.element,
      name: def.name,
      title: def.title,
      dialogueQuote: def.dialogueQuote,
      specialMove: def.specialMove,
      homeDistrict: cfg.district,
      docX: cfg.defaultX,
      docY: cfg.defaultY,
      targetDocX: waypoints[1].x,
      targetDocY: waypoints[1].y,
      headingAngle: Math.random() * Math.PI * 2,
      walkCycle: Math.random() * 10,
      state: 'idle',
      speed: 56 + Math.random() * 12, // Clash of Clans troop walk speed in pixels/sec
      wanderTimer: 2 + Math.random() * 5, // time to idle before walking
      personalityOffset: Math.random(),
      scaleVariant: 1.0,
      districtName: DISTRICT_NAMES[cfg.district],
      waypoints,
      currentWaypointIdx: 0,
      isSpeaking: false,
    };
  });
}
