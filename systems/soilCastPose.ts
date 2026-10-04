const ease = (value: number) => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p); };

export function soilCombatTiming(spellId?: string) {
  if (spellId === 'soil-bedrock-fissure') return { startup: .66, active: .18, recovery: .35 };
  if (spellId === 'soil-boulder-catapult') return { startup: 1.35, active: .22, recovery: .48 };
  return {};
}

/** Terra transfers force through the ground: stamp, excavate/throw, and brace. */
export function soilCastPose(spellId: string, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const recovery = 1 - ease((p - .72) / .28);
  const charge = Math.sin(p * Math.PI) * recovery;
  const pose = {
    bodyX: .08, bodyY: .55, bodyZ: 0,
    leftShoulderX: -.35, rightShoulderX: -.35,
    leftShoulderZ: -.1, rightShoulderZ: .1,
    leftElbow: -.55, rightElbow: -.55,
    leftHip: .12, rightHip: -.12, leftKnee: .16, rightKnee: .16,
  };
  if (spellId === 'soil-bedrock-fissure') {
    const press = ease((p - .1) / .18) * recovery;
    pose.bodyX = .1 + press * .3;
    pose.bodyY -= charge * .07;
    pose.leftShoulderX = -.55 + press * .6;
    pose.rightShoulderX = -1.5 + press * 1.65;
    pose.rightElbow = -.25 - press * .45;
    pose.rightHip = -.3 + press * .55;
    pose.leftKnee += charge * .2;
    pose.rightKnee += charge * .3;
  } else if (spellId === 'soil-boulder-catapult') {
    const scoop = ease(p / .2) * (1 - ease((p - .2) / .22));
    const throwMotion = ease((p - .2) / .23) * recovery;
    pose.bodyY -= scoop * .1;
    pose.bodyX = .35 * scoop - .16 * throwMotion;
    pose.bodyZ = -.13 * scoop + .16 * throwMotion;
    pose.leftShoulderX = .5 * scoop - 2 * throwMotion;
    pose.rightShoulderX = .5 * scoop - 2.3 * throwMotion;
    pose.leftElbow = -.75 + throwMotion * .55;
    pose.rightElbow = -.75 + throwMotion * .55;
    pose.leftKnee += scoop * .45;
    pose.rightKnee += scoop * .45;
  } else {
    const brace = ease(p / .2) * recovery;
    pose.bodyY -= brace * .07;
    pose.leftShoulderX = -.4 - brace * .85;
    pose.rightShoulderX = -.4 - brace * .85;
    pose.leftShoulderZ = -.1 - brace * .3;
    pose.rightShoulderZ = .1 + brace * .3;
    pose.leftElbow = -.55 - brace * .4;
    pose.rightElbow = -.55 - brace * .4;
    pose.leftKnee += brace * .3;
    pose.rightKnee += brace * .3;
  }
  return pose;
}
