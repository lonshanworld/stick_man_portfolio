/** Servo-driven aiming, service mode and braced missile launch. */
export function robotCastPose(id: string, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const active = Math.min(1, p / .16) * Math.min(1, (1 - p) / .2);
  const pose = { bodyX: 0, bodyY: .55, bodyZ: 0,
    leftShoulderX: -.35, rightShoulderX: -.35, leftShoulderZ: -.1, rightShoulderZ: .1,
    leftElbow: -.45, rightElbow: -.45, leftHip: -.1, rightHip: .1, leftKnee: .18, rightKnee: .18 };
  if (id === 'robot-hyper-beam') {
    pose.leftShoulderX -= active * 1.1; pose.rightShoulderX -= active * 1.1;
    pose.leftElbow += active * .35; pose.rightElbow += active * .35;
    pose.bodyX = .08 * active;
  } else if (id === 'robot-overclock-grid') {
    pose.leftShoulderZ -= active * .65; pose.rightShoulderZ += active * .65;
    pose.leftElbow -= active * .55; pose.rightElbow -= active * .55;
  } else {
    pose.bodyY -= active * .035; pose.bodyX = -.12 * active;
    pose.leftKnee += active * .22; pose.rightKnee += active * .22;
    pose.leftShoulderX -= active * .3; pose.rightShoulderX -= active * .3;
    pose.leftHip -= active * .15; pose.rightHip += active * .15;
  }
  return pose;
}
