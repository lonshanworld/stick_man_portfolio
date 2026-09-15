import type { FightInput, FightSnapshot } from './types';
import { EMPTY_FIGHT_INPUT } from './types';

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
    if (this.thinkTimer > 0) return { ...this.intent, jump: false, punch: false, kick: false, spell: null };

    this.thinkTimer = 0.2 + this.random() * 0.42;
    const ai = snapshot.opponent;
    const player = snapshot.player;
    const distance = Math.abs(player.x - ai.x);
    const toward = player.x > ai.x ? 1 : -1;
    const roll = this.random();
    const next: FightInput = { ...EMPTY_FIGHT_INPUT };

    if (ai.hitStun > 0) return next;
    if (ai.y > 0 && ai.jumpsUsed === 1 && roll < 0.32) {
      next.jump = true;
      next.move = toward;
    } else if (roll < 0.1) {
      next.move = this.random() < 0.5 ? toward : (toward * -1) as -1 | 1;
    } else if (distance > 3.5) {
      // Build to the spectacle instead of opening every round with an
      // off-screen ultimate. Slot two unlocks first; slot three is a climax.
      const spellOrder = this.fightAge > 8
        ? ([2, 1, 0] as const)
        : this.fightAge > 3
          ? ([1, 0] as const)
          : ([0] as const);
      const castable = spellOrder.find(index => {
        const spell = ai.spells[index];
        const isRecovery = spell.castType === 'restore'
          || spell.action === 'restore'
          || spell.action === 'cleanse';
        const redundantShield = spell.castType === 'shield' && ai.shieldTime > 0;
        return ai.cooldowns[index] <= 0
          && ai.energy >= [20, 32, 55][index]
          && (!isRecovery || ai.health < 78)
          && !redundantShield;
      });
      if (castable !== undefined && roll > 0.42) next.spell = castable;
      else next.move = toward;
    } else if (distance > 1.45) {
      if (roll < 0.55) next.move = toward;
      else if (roll < 0.72 && ai.cooldowns[0] <= 0 && ai.energy >= 20) next.spell = 0;
      else if (roll < 0.82) next.jump = true;
      else next.move = (toward * -1) as -1 | 1;
    } else if (roll < 0.42) next.punch = true;
    else if (roll < 0.7) next.kick = true;
    else if (roll < 0.83 && ai.cooldowns[0] <= 0 && ai.energy >= 20) next.spell = 0;
    else next.move = (toward * -1) as -1 | 1;

    this.intent = next;
    return { ...next };
  }
}
