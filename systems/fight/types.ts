import type { ElementType } from '../../types';
import type { ElementalSpell } from '../../data/elementalSpells';

export type FightAction =
  | 'idle'
  | 'walk'
  | 'jump'
  | 'fly'
  | 'punch'
  | 'kick'
  | 'spell1'
  | 'spell2'
  | 'spell3'
  | 'hit'
  | 'knockdown'
  | 'stasis'
  | 'victory'
  | 'defeated';

export interface FightInput {
  move: -1 | 0 | 1;
  jump: boolean;
  punch: boolean;
  kick: boolean;
  spell: 0 | 1 | 2 | null;
}

export interface FighterConfig {
  id: string;
  name: string;
  element: ElementType;
  spells: ElementalSpell[];
  stats: {
    speed: number;
    power: number;
    agility: number;
    elementalMastery: number;
  };
}

export interface FighterState extends FighterConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  jumpsUsed: 0 | 1 | 2;
  flightTime: number;
  facing: -1 | 1;
  health: number;
  energy: number;
  action: FightAction;
  actionTime: number;
  hitStun: number;
  invulnerable: number;
  shieldTime: number;
  slowTime: number;
  stasisTime: number;
  cooldowns: [number, number, number];
  actionConnected: boolean;
  /** Locked world-space destination for the current spell. */
  actionTargetX: number | null;
}

export type FightPhase = 'intro' | 'fighting' | 'finished';
export type FightResult = { winnerId: string | null; reason: 'ko' | 'time' | 'draw' };

export interface FightSnapshot {
  phase: FightPhase;
  timeLeft: number;
  introTime: number;
  player: FighterState;
  opponent: FighterState;
  result: FightResult | null;
}

export type FightEvent =
  | {
      type: 'cast';
      fighterId: string;
      spellIndex: 0 | 1 | 2;
      originX: number;
      targetX: number;
    }
  | { type: 'hit'; fighterId: string; targetId: string; damage: number }
  | { type: 'jump'; fighterId: string; jumpNumber: 1 | 2 }
  | { type: 'flight'; fighterId: string }
  | { type: 'ko'; fighterId: string };

export const EMPTY_FIGHT_INPUT: FightInput = {
  move: 0,
  jump: false,
  punch: false,
  kick: false,
  spell: null,
};
