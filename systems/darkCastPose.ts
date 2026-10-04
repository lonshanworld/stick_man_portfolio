const ease = (n: number) => { const p = Math.max(0, Math.min(1, n)); return p * p * (3 - 2 * p); };

export function darkCombatTiming(id?: string) {
  if (id === 'dark-abyssal-grasp') return { startup: .75, active: .2, recovery: .45 };
  if (id === 'dark-phantom-wave') return { startup: .62, active: .25, recovery: .5 };
  return {};
}

/** Grasp a soul, beckon the departed, or unfurl the fallen demon form. */
export function darkCastPose(id: string, progress: number) {
  const p = Math.max(0, Math.min(1, progress)), strength = ease(p / .3) * (1 - ease((p - .7) / .3));
  const pose = { bodyX: 0, bodyY: .55, bodyZ: 0, leftShoulderX: -.35, rightShoulderX: -.35, leftShoulderZ: -.08, rightShoulderZ: .08, leftElbow: -.45, rightElbow: -.45, leftHip: .06, rightHip: -.06, leftKnee: .12, rightKnee: .12 };
  if (id === 'dark-abyssal-grasp') {
    pose.bodyX = .13 * strength; pose.bodyY -= .035 * strength;
    pose.rightShoulderX -= 1.35 * strength; pose.rightElbow -= .38 * strength;
    pose.leftShoulderX -= .4 * strength; pose.leftElbow -= .5 * strength;
    pose.rightShoulderZ += .2 * strength;
  } else if (id === 'dark-phantom-wave') {
    pose.bodyX = -.08 * strength;
    pose.leftShoulderX -= 1.1 * strength; pose.rightShoulderX -= 1.1 * strength;
    pose.leftShoulderZ -= .7 * strength; pose.rightShoulderZ += .7 * strength;
    pose.leftElbow -= .65 * strength; pose.rightElbow -= .65 * strength;
  } else {
    pose.bodyY -= .04 * strength;
    pose.leftShoulderX -= 1.6 * strength; pose.rightShoulderX -= 1.6 * strength;
    pose.leftShoulderZ -= .8 * strength; pose.rightShoulderZ += .8 * strength;
    pose.leftElbow -= .45 * strength; pose.rightElbow -= .45 * strength;
    pose.leftKnee += .16 * strength; pose.rightKnee += .16 * strength;
  }
  return pose;
}
