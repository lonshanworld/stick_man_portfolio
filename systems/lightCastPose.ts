const ease = (n: number) => { const p = Math.max(0, Math.min(1, n)); return p * p * (3 - 2 * p); };

/** Open palms for sunlight, a measured one-handed release, and a protective wing stance. */
export function lightCastPose(spellId: string, progress: number) {
  const glow = ease(progress / .25) * (1 - ease((progress - .72) / .28));
  const pose = { bodyX: -.08 * glow, bodyY: .55 + .04 * glow, bodyZ: 0,
    leftShoulderX: -.35 - glow * .8, rightShoulderX: -.35 - glow * .8,
    leftShoulderZ: -.08 - glow * .6, rightShoulderZ: .08 + glow * .6,
    leftElbow: -.45 + glow * .25, rightElbow: -.45 + glow * .25,
    leftHip: .06, rightHip: -.06, leftKnee: .12, rightKnee: .12 };
  if (spellId === 'light-sunburst-lance') {
    const release = ease((progress - .25) / .25) * glow;
    pose.bodyZ = -.15 * glow;
    pose.leftShoulderX = -.35 - glow * .3;
    pose.rightShoulderX = -.35 - glow * 1.5;
    pose.rightShoulderZ = .08 + .45 * glow - .5 * release;
    pose.rightElbow = -.45 - glow * .65 + release * .9;
  } else if (spellId === 'light-supernova-flare') {
    pose.bodyY = .55;
    pose.leftShoulderX = pose.rightShoulderX = -.35 - glow * 1.1;
    pose.leftShoulderZ = -.08 - glow * .9;
    pose.rightShoulderZ = .08 + glow * .9;
  }
  return pose;
}
