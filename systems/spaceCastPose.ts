const smooth = (n: number) => { const p = Math.max(0, Math.min(1, n)); return p * p * (3 - 2 * p); };

/** Compression, folding, and orbital conducting give Space three independent gestures. */
export function spaceCastPose(spellId: string, progress: number) {
  const charge = smooth(progress / .22) * (1 - smooth((progress - .72) / .28));
  const release = smooth((progress - .28) / .2);
  const pose = { bodyX: -.10 * charge, bodyY: .55 + .025 * charge, bodyZ: -.06 * charge,
    leftShoulderX: -.35 - charge * .7, rightShoulderX: -.35 - charge * 1.2,
    leftShoulderZ: -.1 - charge * .4, rightShoulderZ: .1 + charge * .4,
    leftElbow: -.45 - charge * .5, rightElbow: -.45 - charge * .6,
    leftHip: -.12 * charge, rightHip: .15 * charge, leftKnee: .15, rightKnee: .15 };
  if (spellId === 'space-meteor-shower') {
    pose.leftShoulderZ += release * charge * .3;
    pose.rightShoulderZ -= release * charge * .3;
    pose.leftElbow += release * charge * .65;
    pose.rightElbow += release * charge * .75;
  } else if (spellId === 'space-cosmic-ray') {
    pose.bodyZ = -.2 * charge;
    pose.leftShoulderX = -.35 - charge * .25;
    pose.rightShoulderX = -.35 - charge * 1.65;
    pose.rightElbow = -.45 + release * charge * .4;
    pose.rightHip = -.25 * charge;
  } else {
    pose.leftShoulderX = -.35 - charge * 1.25;
    pose.rightShoulderX = -.35 - charge * 1.25;
    pose.leftShoulderZ = -.1 - charge * .8;
    pose.rightShoulderZ = .1 + charge * .8;
    pose.leftElbow = pose.rightElbow = -.45 + charge * .3;
  }
  return pose;
}
