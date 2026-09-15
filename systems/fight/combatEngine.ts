import type { SpellCastType } from '../../data/elementalSpells';
import { getCombatSpellHitRadius, isTargetCenteredCombatSpell } from './spellPresentation';
import type {
  FightEvent,
  FightInput,
  FightPhase,
  FightResult,
  FightSnapshot,
  FighterConfig,
  FighterState,
} from './types';

const ROUND_SECONDS = 60;
const INTRO_SECONDS = 2.7;
const ARENA_LIMIT = 5.7;
const GRAVITY = 15;
const WIND_FLIGHT_SECONDS = 2.8;

interface AttackDefinition {
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  range: number;
  knockback: number;
}

const PHYSICAL_ATTACKS: Record<'punch' | 'kick', AttackDefinition> = {
  punch: { startup: 0.08, active: 0.11, recovery: 0.2, damage: 2, range: 1.35, knockback: 1.3 },
  kick: { startup: 0.16, active: 0.14, recovery: 0.34, damage: 4, range: 1.72, knockback: 2.2 },
};

const SPELL_DAMAGE = [15, 22, 40] as const;
const SPELL_COST = [20, 32, 55] as const;
const SPELL_COOLDOWN = [3.8, 6.5, 11] as const;
const SPELL_TIMING: AttackDefinition[] = [
  { startup: 0.3, active: 0.18, recovery: 0.35, damage: 15, range: 3.2, knockback: 2.3 },
  { startup: 0.42, active: 0.22, recovery: 0.48, damage: 22, range: 4.2, knockback: 3.0 },
  { startup: 0.62, active: 0.3, recovery: 0.72, damage: 40, range: 5.8, knockback: 4.2 },
];

const copyFighter = (fighter: FighterState): FighterState => ({
  ...fighter,
  stats: { ...fighter.stats },
  spells: fighter.spells,
  cooldowns: [...fighter.cooldowns] as [number, number, number],
});

function createFighter(config: FighterConfig, x: number, facing: -1 | 1): FighterState {
  return {
    ...config,
    x,
    y: 0,
    vx: 0,
    vy: 0,
    jumpsUsed: 0,
    flightTime: 0,
    facing,
    health: 100,
    energy: 100,
    action: 'idle',
    actionTime: 0,
    hitStun: 0,
    invulnerable: 0,
    shieldTime: 0,
    slowTime: 0,
    stasisTime: 0,
    cooldowns: [0, 0, 0],
    actionConnected: false,
    actionTargetX: null,
  };
}

export class CombatEngine {
  private player: FighterState;
  private opponent: FighterState;
  private phase: FightPhase = 'intro';
  private timeLeft = ROUND_SECONDS;
  private introTime = INTRO_SECONDS;
  private result: FightResult | null = null;
  private events: FightEvent[] = [];

  constructor(player: FighterConfig, opponent: FighterConfig) {
    this.player = createFighter(player, -3.1, 1);
    this.opponent = createFighter(opponent, 3.1, -1);
  }

  reset(): void {
    this.player = createFighter(this.player, -3.1, 1);
    this.opponent = createFighter(this.opponent, 3.1, -1);
    this.phase = 'intro';
    this.timeLeft = ROUND_SECONDS;
    this.introTime = INTRO_SECONDS;
    this.result = null;
    this.events = [];
  }

  step(delta: number, playerInput: FightInput, opponentInput: FightInput): void {
    const dt = Math.min(Math.max(delta, 0), 0.05);
    if (this.phase === 'intro') {
      this.introTime = Math.max(0, this.introTime - dt);
      if (this.introTime === 0) this.phase = 'fighting';
      return;
    }
    if (this.phase !== 'fighting') return;

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.updateFighter(this.player, this.opponent, playerInput, dt);
    this.updateFighter(this.opponent, this.player, opponentInput, dt);
    this.resolveSeparation();

    if (this.player.health <= 0 || this.opponent.health <= 0) {
      const winner = this.player.health <= 0 ? this.opponent : this.player;
      const loser = winner === this.player ? this.opponent : this.player;
      this.finish({ winnerId: winner.id, reason: 'ko' }, winner, loser);
    } else if (this.timeLeft <= 0) {
      if (this.player.health === this.opponent.health) {
        this.finish({ winnerId: null, reason: 'draw' });
      } else {
        const winner = this.player.health > this.opponent.health ? this.player : this.opponent;
        const loser = winner === this.player ? this.opponent : this.player;
        this.finish({ winnerId: winner.id, reason: 'time' }, winner, loser);
      }
    }
  }

  private updateFighter(fighter: FighterState, target: FighterState, input: FightInput, dt: number): void {
    const canTurn = fighter.hitStun <= 0
      && fighter.stasisTime <= 0
      && fighter.action !== 'punch'
      && fighter.action !== 'kick'
      && !fighter.action.startsWith('spell');
    // Fighters visibly turn when retreating instead of moonwalking while their
    // face remains locked to the opponent. Attacks preserve the chosen facing.
    if (canTurn && input.move !== 0) fighter.facing = input.move;
    fighter.cooldowns = fighter.cooldowns.map(value => Math.max(0, value - dt)) as [number, number, number];
    fighter.energy = Math.min(100, fighter.energy + dt * 5.5);
    fighter.invulnerable = Math.max(0, fighter.invulnerable - dt);
    fighter.shieldTime = Math.max(0, fighter.shieldTime - dt);
    fighter.slowTime = Math.max(0, fighter.slowTime - dt);
    const wasInStasis = fighter.stasisTime > 0;
    fighter.stasisTime = Math.max(0, fighter.stasisTime - dt);
    if (!wasInStasis) {
      fighter.flightTime = Math.max(0, fighter.flightTime - dt);
      if (fighter.flightTime === 0 && fighter.action === 'fly') fighter.action = 'jump';
    }

    if (wasInStasis) {
      fighter.vx = 0;
      fighter.vy = 0;
      fighter.action = fighter.stasisTime > 0 ? 'stasis' : this.airAction(fighter);
    } else if (fighter.hitStun > 0) {
      fighter.hitStun = Math.max(0, fighter.hitStun - dt);
      fighter.action = fighter.hitStun > 0.34 ? 'knockdown' : 'hit';
      if (fighter.hitStun === 0) fighter.action = this.airAction(fighter);
    } else if (fighter.action === 'punch' || fighter.action === 'kick') {
      this.advanceAttack(fighter, target, PHYSICAL_ATTACKS[fighter.action], dt);
    } else if (fighter.action.startsWith('spell')) {
      const index = Number(fighter.action.slice(-1)) - 1 as 0 | 1 | 2;
      this.advanceSpell(fighter, target, index, dt);
    } else {
      this.acceptInput(fighter, target, input);
    }

    if (!wasInStasis) {
      if (fighter.flightTime > 0) {
        fighter.vy += ((1.42 - fighter.y) * 8 - fighter.vy * 4.2) * dt;
      } else {
        fighter.vy -= GRAVITY * dt;
      }
      fighter.y += fighter.vy * dt;
    }
    if (fighter.y <= 0) {
      fighter.y = 0;
      fighter.vy = 0;
      fighter.jumpsUsed = 0;
      fighter.flightTime = 0;
      if ((fighter.action === 'jump' || fighter.action === 'fly') && fighter.hitStun === 0) fighter.action = 'idle';
    }
    fighter.x = Math.max(-ARENA_LIMIT, Math.min(ARENA_LIMIT, fighter.x + fighter.vx * dt));
    fighter.vx *= Math.pow(0.035, dt);
  }

  private acceptInput(fighter: FighterState, target: FighterState, input: FightInput): void {
    // Resolve jump first so a same-frame punch or kick becomes an aerial attack
    // instead of swallowing the jump input.
    if (input.jump && fighter.jumpsUsed < 2) {
      const jumpNumber = (fighter.y <= 0.001 ? 1 : fighter.jumpsUsed + 1) as 1 | 2;
      fighter.jumpsUsed = jumpNumber;
      const activatesFlight = fighter.element === 'wind' && jumpNumber === 2;
      fighter.vy = activatesFlight
        ? 3.25
        : (jumpNumber === 1 ? 5.4 : 5.05) + (fighter.stats.agility - 85) * 0.018;
      fighter.action = activatesFlight ? 'fly' : 'jump';
      if (activatesFlight) {
        fighter.flightTime = WIND_FLIGHT_SECONDS;
        this.events.push({ type: 'flight', fighterId: fighter.id });
      } else {
        this.events.push({ type: 'jump', fighterId: fighter.id, jumpNumber });
      }
    }
    if (input.spell !== null && this.canCast(fighter, input.spell)) {
      fighter.facing = fighter.x <= target.x ? 1 : -1;
      this.beginAction(fighter, `spell${input.spell + 1}` as FighterState['action']);
      const spell = fighter.spells[input.spell];
      const actionTargetX = spell.action === 'teleport'
        ? this.teleportDestination(fighter, target)
        : this.spellTargetX(fighter, target, input.spell);
      fighter.actionTargetX = actionTargetX;
      fighter.energy -= SPELL_COST[input.spell];
      fighter.cooldowns[input.spell] = SPELL_COOLDOWN[input.spell];
      this.events.push({
        type: 'cast',
        fighterId: fighter.id,
        spellIndex: input.spell,
        originX: fighter.x,
        targetX: actionTargetX,
      });
      return;
    }
    if (input.kick) {
      fighter.facing = fighter.x <= target.x ? 1 : -1;
      this.beginAction(fighter, 'kick');
      return;
    }
    if (input.punch) {
      fighter.facing = fighter.x <= target.x ? 1 : -1;
      this.beginAction(fighter, 'punch');
      return;
    }
    const flightSpeed = fighter.flightTime > 0 ? 1.18 : 1;
    const speed = (3.0 + (fighter.stats.speed - 85) * 0.022) * (fighter.slowTime > 0 ? 0.62 : 1) * flightSpeed;
    fighter.vx = input.move * speed;
    if (fighter.y === 0 && fighter.action !== 'jump') fighter.action = input.move ? 'walk' : 'idle';
  }

  private beginAction(fighter: FighterState, action: FighterState['action']): void {
    fighter.action = action;
    fighter.actionTime = 0;
    fighter.actionConnected = false;
    fighter.actionTargetX = null;
    if (fighter.y > 0 || fighter.vy > 0) {
      const airLunge = action === 'kick' ? 1.05 : action === 'punch' ? 0.72 : 0.25;
      fighter.vx += fighter.facing * airLunge;
    } else {
      fighter.vx *= 0.25;
    }
  }

  private advanceAttack(fighter: FighterState, target: FighterState, attack: AttackDefinition, dt: number): void {
    fighter.actionTime += dt;
    const activeEnd = attack.startup + attack.active;
    if (!fighter.actionConnected && fighter.actionTime >= attack.startup && fighter.actionTime <= activeEnd) {
      if (Math.abs(target.x - fighter.x) <= attack.range && target.invulnerable <= 0) {
        this.applyDamage(fighter, target, attack.damage, attack.knockback, fighter.action === 'kick' ? 0.31 : 0.2);
        fighter.actionConnected = true;
      }
    }
    if (fighter.actionTime >= activeEnd + attack.recovery) fighter.action = this.airAction(fighter);
  }

  private advanceSpell(fighter: FighterState, target: FighterState, index: 0 | 1 | 2, dt: number): void {
    const attack = SPELL_TIMING[index];
    const spell = fighter.spells[index];
    if (!fighter.actionConnected && spell && isTargetCenteredCombatSpell(spell)) {
      fighter.actionTargetX = this.spellTargetX(fighter, target, index);
    }
    fighter.actionTime += dt;
    const activeEnd = attack.startup + attack.active;
    if (!fighter.actionConnected && fighter.actionTime >= attack.startup) {
      fighter.actionConnected = true;
      this.resolveSpell(fighter, target, index, spell?.castType ?? 'attack');
    }
    if (fighter.actionTime >= activeEnd + attack.recovery) fighter.action = this.airAction(fighter);
  }

  private resolveSpell(fighter: FighterState, target: FighterState, index: 0 | 1 | 2, castType: SpellCastType): void {
    const attack = SPELL_TIMING[index];
    const spell = fighter.spells[index];
    const spellAction = spell?.action;
    if (castType === 'restore' || spellAction === 'restore' || spellAction === 'cleanse') {
      fighter.health = Math.min(100, fighter.health + SPELL_DAMAGE[index] * 0.7);
      return;
    }
    if (castType === 'shield' || spellAction === 'shield' || spellAction === 'cloak') {
      fighter.shieldTime = 1.4 + index * 0.35;
      if (spellAction === 'cloak') fighter.invulnerable = Math.max(fighter.invulnerable, 0.55);
      return;
    }
    if (castType === 'mobility') {
      if (spellAction === 'teleport') {
        fighter.x = fighter.actionTargetX ?? this.teleportDestination(fighter, target);
        fighter.facing = fighter.x <= target.x ? 1 : -1;
        fighter.vx = 0;
        fighter.invulnerable = 0.46;
      } else if (spellAction === 'levitate') {
        fighter.vy = Math.max(fighter.vy, 6.15);
        fighter.vx = fighter.facing * 1.35;
        fighter.invulnerable = 0.3;
      } else {
        // Rewind is a defensive back-step; it must not behave like teleport.
        fighter.x = Math.max(-ARENA_LIMIT, Math.min(ARENA_LIMIT, fighter.x - fighter.facing * (1.8 + index * 0.25)));
        fighter.vx = 0;
        fighter.invulnerable = 0.4;
      }
      return;
    }
    const impactX = fighter.actionTargetX ?? this.spellTargetX(fighter, target, index);
    const hitRadius = getCombatSpellHitRadius(spell);
    // Resolve against the same locked impact center used by the rendered spell.
    // Moving outside the visible area during startup now genuinely dodges it.
    if (Math.abs(target.x - impactX) > hitRadius || target.invulnerable > 0) return;
    if (spellAction === 'stasis') {
      this.applyDamage(fighter, target, attack.damage, 0, 0, true);
      target.stasisTime = spell.statusDuration ?? 4;
      target.hitStun = 0;
      target.slowTime = 0;
      target.vx = 0;
      target.vy = 0;
      target.action = 'stasis';
      return;
    }
    const stun = castType === 'control' ? 0.48 + index * 0.14 : 0.32 + index * 0.1;
    if (castType === 'control') target.slowTime = 1.7;
    this.applyDamage(fighter, target, attack.damage, attack.knockback, stun, true);
  }

  private teleportDestination(fighter: FighterState, target: FighterState): number {
    const forwardGap = (target.x - fighter.x) * fighter.facing;
    const destination = forwardGap > 1.3 && forwardGap < 3.8
      ? target.x + fighter.facing * 0.92
      : fighter.x + fighter.facing * 2.65;
    return Math.max(-ARENA_LIMIT, Math.min(ARENA_LIMIT, destination));
  }

  private spellTargetX(fighter: FighterState, target: FighterState, index: 0 | 1 | 2): number {
    const spell = fighter.spells[index];
    if (spell && isTargetCenteredCombatSpell(spell)) return target.x;
    const maximumTravel = SPELL_TIMING[index].range;
    const offset = Math.max(-maximumTravel, Math.min(maximumTravel, target.x - fighter.x));
    return fighter.x + offset;
  }

  private applyDamage(
    fighter: FighterState,
    target: FighterState,
    baseDamage: number,
    knockback: number,
    stun: number,
    spell = false,
  ): void {
    const stat = spell ? fighter.stats.elementalMastery : fighter.stats.power;
    const modifier = 1 + Math.max(-0.08, Math.min(0.08, (stat - 90) * 0.008));
    const shieldModifier = target.shieldTime > 0 ? 0.35 : 1;
    const damage = Math.max(1, Math.round(baseDamage * modifier * shieldModifier));
    target.health = Math.max(0, target.health - damage);
    target.hitStun = stun * (target.shieldTime > 0 ? 0.45 : 1);
    target.invulnerable = 0.12;
    target.vx = fighter.facing * knockback * (target.shieldTime > 0 ? 0.35 : 1);
    if (damage >= 30) target.vy = 2.5;
    // Stasis prevents reactions and knockback, not damage. This allows the
    // attacker to combo a time-frozen opponent without ending the four-second
    // freeze early or pushing the target outside the visible field.
    if (target.stasisTime > 0) {
      target.hitStun = 0;
      target.vx = 0;
      target.vy = 0;
      target.action = 'stasis';
    }
    if (target.stasisTime <= 0) target.flightTime = 0;
    this.events.push({ type: 'hit', fighterId: fighter.id, targetId: target.id, damage });
  }

  private resolveSeparation(): void {
    // Airborne fighters can clear the opponent instead of colliding with an
    // invisible vertical wall during a running double jump.
    if (this.player.y > 0.68 || this.opponent.y > 0.68) return;
    const distance = this.opponent.x - this.player.x;
    if (Math.abs(distance) >= 0.72) return;
    const push = (0.72 - Math.abs(distance)) / 2;
    const direction = distance >= 0 ? 1 : -1;
    this.player.x = Math.max(-ARENA_LIMIT, this.player.x - push * direction);
    this.opponent.x = Math.min(ARENA_LIMIT, this.opponent.x + push * direction);
  }

  private airAction(fighter: FighterState): FighterState['action'] {
    if (fighter.y <= 0) return 'idle';
    return fighter.flightTime > 0 ? 'fly' : 'jump';
  }

  private canCast(fighter: FighterState, index: 0 | 1 | 2): boolean {
    return Boolean(fighter.spells[index]) && fighter.cooldowns[index] <= 0 && fighter.energy >= SPELL_COST[index];
  }

  private finish(result: FightResult, winner?: FighterState, loser?: FighterState): void {
    this.phase = 'finished';
    this.result = result;
    if (winner) winner.action = 'victory';
    if (loser) {
      loser.action = 'defeated';
      this.events.push({ type: 'ko', fighterId: loser.id });
    }
  }

  snapshot(): FightSnapshot {
    return {
      phase: this.phase,
      timeLeft: this.timeLeft,
      introTime: this.introTime,
      player: copyFighter(this.player),
      opponent: copyFighter(this.opponent),
      result: this.result ? { ...this.result } : null,
    };
  }

  drainEvents(): FightEvent[] {
    return this.events.splice(0, this.events.length);
  }
}

export const FIGHT_RULES = {
  roundSeconds: ROUND_SECONDS,
  spellCosts: SPELL_COST,
  spellCooldowns: SPELL_COOLDOWN,
};
