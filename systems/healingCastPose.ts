const ease = (n: number) => { const p = Math.max(0, Math.min(1, n)); return p * p * (3 - 2 * p); };

/** Open palms, a careful familiar release, and a cleansing overhead blessing. */
export function healingCastPose(spellId: string, progress: number) {
  const p = Math.max(0, Math.min(1, progress)), lift = ease(p / .22) * (1 - ease((p - .7) / .3));
  const pose = { bodyX: -.06 * lift, bodyY: .55, bodyZ: 0,
    leftShoulderX: -.3 - lift * .65, rightShoulderX: -.3 - lift * .65,
    leftShoulderZ: -.3 * lift, rightShoulderZ: .3 * lift,
    leftElbow: -.65, rightElbow: -.65, leftHip: .04, rightHip: -.04, leftKnee: .08, rightKnee: .08 };
  if (spellId === 'healing-petal-breeze') {
    pose.leftShoulderX = -.4 - lift * .2; pose.leftElbow = -1.1;
    pose.rightShoulderX = -.3 - lift * 1.2; pose.rightElbow = -.8 + lift * .55;
  } else if (spellId === 'healing-vitality-rain') {
    pose.leftShoulderX = pose.rightShoulderX = -.3 - lift * 1.8;
    pose.leftElbow = pose.rightElbow = -.4;
  }
  return pose;
}
