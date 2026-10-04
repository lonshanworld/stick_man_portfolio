import { ease } from './spellDrawing';

/** Wind a moment backward, perch a timekeeper on the wrist, or pinch a second shut. */
export function timeCastPose(spellId: string, progress: number) {
  const charge = ease(progress / .22) * (1 - ease((progress - .72) / .28));
  const pose = { bodyX: 0, bodyY: .55, bodyZ: 0,
    leftShoulderX: -.35, rightShoulderX: -.35, leftShoulderZ: -.1, rightShoulderZ: .1,
    leftElbow: -.45, rightElbow: -.45, leftHip: 0, rightHip: 0, leftKnee: .12, rightKnee: .12 };
  if (spellId === 'time-chrono-rewind') {
    pose.bodyX = -.16 * charge;
    pose.rightShoulderX -= charge * 1.1; pose.rightElbow -= charge * .8;
    pose.leftShoulderZ -= charge * .75; pose.leftElbow -= charge * .9;
    pose.rightHip = .25 * charge; pose.leftHip = -.2 * charge;
  } else if (spellId === 'time-gear-barrage') {
    pose.leftShoulderX -= charge * 1.35; pose.leftElbow += charge * .3;
    pose.rightShoulderX -= charge * .45; pose.rightElbow -= charge * 1.2;
    pose.bodyZ = .08 * charge;
  } else {
    const stopped = Math.min(progress, .38);
    const pinch = ease(stopped / .38) * (1 - ease((progress - .72) / .28));
    pose.rightShoulderX -= pinch * 1.6; pose.rightElbow += pinch * .4;
    pose.leftShoulderX -= pinch * .4; pose.leftElbow -= pinch;
  }
  return pose;
}
