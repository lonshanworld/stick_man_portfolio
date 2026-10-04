const ease = (value: number) => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p); };

export function treeCombatTiming(spellId?: string) {
  if (spellId === 'trees-root-entanglement') return { startup: .95, active: .18, recovery: .4 };
  if (spellId === 'trees-spore-bloom') return { startup: .75, active: .22, recovery: .48 };
  return {};
}

/** Sow and pull roots, nurture a grove, and raise a branching canopy. */
export function treeCastPose(spellId: string, progress: number) {
  const p = Math.max(0, Math.min(1, progress)), release = 1 - ease((p - .72) / .28), grow = ease(p / .3) * release;
  const pose = {
    bodyX: 0, bodyY: .55, bodyZ: 0,
    leftShoulderX: -.35, rightShoulderX: -.35, leftShoulderZ: -.08, rightShoulderZ: .08,
    leftElbow: -.45, rightElbow: -.45, leftHip: .06, rightHip: -.06, leftKnee: .12, rightKnee: .12,
  };
  if (spellId === 'trees-root-entanglement') {
    const sow = Math.sin(Math.min(1, p / .45) * Math.PI) * release;
    pose.bodyX = sow * .35;
    pose.bodyY -= sow * .075;
    pose.leftShoulderX = -.15 - grow * .85;
    pose.rightShoulderX = .2 - grow * 1.3;
    pose.leftShoulderZ = -.08 - grow * .32;
    pose.rightShoulderZ = .08 + grow * .32;
    pose.rightElbow = -.45 - grow * .25;
    pose.leftKnee += sow * .3; pose.rightKnee += sow * .3;
  } else if (spellId === 'trees-spore-bloom') {
    pose.bodyX = -.1 * grow;
    pose.leftShoulderX = -.35 - grow * 1.1;
    pose.rightShoulderX = -.35 - grow * 1.1;
    pose.leftShoulderZ = -.08 - grow * .6;
    pose.rightShoulderZ = .08 + grow * .6;
    pose.leftElbow = -.45 - grow * .2;
    pose.rightElbow = -.45 - grow * .2;
  } else {
    pose.bodyY -= grow * .035;
    pose.leftShoulderX = -.35 - grow * 1.8;
    pose.rightShoulderX = -.35 - grow * 1.8;
    pose.leftShoulderZ = -.08 - grow * .42;
    pose.rightShoulderZ = .08 + grow * .42;
    pose.leftElbow = -.45 + grow * .2;
    pose.rightElbow = -.45 + grow * .2;
    pose.leftKnee += grow * .15; pose.rightKnee += grow * .15;
  }
  return pose;
}
