import type { FightInput, FightSnapshot } from './types';
import { EMPTY_FIGHT_INPUT } from './types';
import { FIGHT_RULES } from './combatEngine';
import { isCombatSupportSpell } from './spellPresentation';

/** Deliberately fallible distance-based AI that obeys the same engine inputs as the player. */
export class FighterAI {
  private thinkTimer = 0;
  private fightAge = 0;
  private intent: FightInput = { ...EMPTY_FIGHT_INPUT };

  constructor(private readonly random: () => number = Math.random) {}

  reset(): void {
    this.thinkTimer = 0;
    this.fightAge = 0;
    this.intent = { ...EMPTY_FIGHT_INPUT };
  }

  update(delta: number, snapshot: FightSnapshot): FightInput {
    if (snapshot.phase !== 'fighting' || snapshot.opponent.health <= 0) return { ...EMPTY_FIGHT_INPUT };
    this.fightAge += delta;
    this.thinkTimer -= delta;
    const ai = snapshot.opponent;
    if (ai.hitStun > 0 || ai.stasisTime > 0 || ai.freezeTime > 0
      || ai.action === 'punch' || ai.action === 'kick' || ai.action.startsWith('spell')) {
      this.intent = { ...EMPTY_FIGHT_INPUT };
      return { ...this.intent };
    }
    if (this.thinkTimer > 0) return { ...this.intent, move: ai.rootTime > 0 ? 0 : this.intent.move, jump: false, punch: false, kick: false, spell: null };

    this.thinkTimer = 0.2 + this.random() * 0.42;
    const player = snapshot.player;
    const distance = Math.abs(player.x - ai.x);
    const toward = player.x > ai.x ? 1 : -1;
    const roll = this.random();
    const next: FightInput = { ...EMPTY_FIGHT_INPUT };

    const canUse = (index: 0 | 1 | 2) => Boolean(ai.spells[index]) && ai.silenceTime <= 0
      && ai.cooldowns[index] <= 0 && ai.energy >= FIGHT_RULES.spellCosts[index];
    const slots = [0, 1, 2] as const;
    const recovering = slots.find(index => canUse(index)
      && ['restore', 'cleanse'].includes(ai.spells[index].action)
      && (ai.health < 72 || (ai.spells[index].action === 'cleanse' && (ai.rootTime > 0 || ai.slowTime > 0))));
    const guarding = slots.find(index => canUse(index) && ['shield', 'cloak'].includes(ai.spells[index].action)
      && ai.shieldTime <= 0 && (player.action.startsWith('spell') || (distance < 2 && ['punch', 'kick'].includes(player.action))));
    const transforming = slots.find(index => canUse(index) && ai.spells[index].action === 'transform'
      && ai.archangelTime <= 0 && ai.demonTime <= 0 && this.fightAge > 8);
    const escaping = slots.find(index => canUse(index) && ['teleport', 'rewind', 'levitate'].includes(ai.spells[index].action)
      && distance < 1.8 && ai.health < 45 && roll < .5);
    const utility = recovering ?? guarding ?? escaping ?? (roll > .35 ? transforming : undefined);
    if (utility !== undefined) {
      next.spell = utility;
      this.intent = next;
      return next;
    }
    const attackOrder = this.fightAge > 8 ? ([2, 1, 0] as const)
      : this.fightAge > 3 ? ([1, 0] as const) : ([0] as const);
    const attackSpell = attackOrder.find(index => canUse(index)
      && !isCombatSupportSpell(ai.spells[index]));
    if (ai.y > 0 && ai.jumpsUsed === 1 && roll < 0.32) {
      next.jump = true;
      next.move = toward;
    } else if (roll < 0.1) {
      next.move = this.random() < 0.5 ? toward : (toward * -1) as -1 | 1;
    } else if (distance > 3.5) {
      // Build to the spectacle instead of opening every round with an
      // off-screen ultimate. Slot two unlocks first; slot three is a climax.
      const castable = attackSpell;
      if (castable !== undefined && roll > 0.42) next.spell = castable;
      else next.move = toward;
    } else if (distance > 1.45) {
      if (roll < 0.55) next.move = toward;
      else if (roll < 0.72 && attackSpell !== undefined) next.spell = attackSpell;
      else if (roll < 0.82) next.jump = true;
      else next.move = (toward * -1) as -1 | 1;
    } else if (roll < 0.42) next.punch = true;
    else if (roll < 0.7) next.kick = true;
    else if (roll < 0.83 && attackSpell !== undefined) next.spell = attackSpell;
    else next.move = (toward * -1) as -1 | 1;

    if (ai.rootTime > 0) {
      next.move = 0;
      next.jump = false;
      next.kick = false;
    }
    this.intent = next;
    return { ...next };
  }
}
