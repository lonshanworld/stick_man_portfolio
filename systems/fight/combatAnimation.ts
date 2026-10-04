import { updateSilenceMarker } from '../silenceMarker';
import { healingCastPose } from '../healingCastPose';
import { updateHealingPower } from '../healingVitality';
import { robotCastPose } from '../robotCastPose';
import { updateTimePower } from '../timeChronology';
import { timeCastPose } from '../timeCastPose';
import { spaceCastPose } from '../spaceCastPose';
import { updateSpacePower } from '../spaceCosmos';
import { updateFallenLucifer } from '../fallenLucifer';
import { updateArchangelMichael } from '../archangelMichael';
import { lightCastPose } from '../lightCastPose';
import * as THREE from 'three';
import type { StickMan3DCharacter } from '../../types';
import type { FighterState } from './types';
import { updateHandMagicSeal } from '../magicSeal3D';
import { soilCastPose, soilCombatTiming } from '../soilCastPose';
import { treeCastPose, treeCombatTiming } from '../treeCastPose';
import { darkCastPose, darkCombatTiming } from '../darkCastPose';

interface CombatPose {
  bodyY: number;
  bodyX: number;
  bodyZ: number;
  bodyScale: number;
  leftShoulderX: number;
  rightShoulderX: number;
  leftShoulderZ: number;
  rightShoulderZ: number;
  leftElbow: number;
  rightElbow: number;
  leftHip: number;
  rightHip: number;
  leftKnee: number;
  rightKnee: number;
  coreScale: number;
  sealScale: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const p = clamp01(value);
  return p * p * (3 - 2 * p);
};
const damp = (value: number, target: number, delta: number, speed = 15) =>
  THREE.MathUtils.lerp(value, target, 1 - Math.exp(-speed * Math.min(delta, 0.05)));

function actionMotion(time: number, startup: number, active: number, recovery: number) {
  const activeEnd = startup + active;
  if (time < startup) return { windup: smooth(time / startup), strike: 0 };
  if (time < activeEnd) {
    const strike = smooth((time - startup) / active);
    return { windup: 1 - strike, strike };
  }
  return { windup: 0, strike: 1 - smooth((time - activeEnd) / recovery) };
}

function basePose(fighter: FighterState, time: number): CombatPose {
  const airborne = fighter.y > 0.025 || fighter.vy > 0.05;
  const pose: CombatPose = {
    bodyY: 0.55 + (airborne ? 0 : Math.sin(time * 3.2) * 0.018),
    bodyX: 0.07,
    bodyZ: 0,
    bodyScale: 1,
    leftShoulderX: -0.34,
    rightShoulderX: -0.5,
    leftShoulderZ: -0.08,
    rightShoulderZ: 0.08,
    leftElbow: -0.52,
    rightElbow: -0.62,
    leftHip: 0.14,
    rightHip: -0.14,
    leftKnee: 0.2,
    rightKnee: 0.2,
    coreScale: 1,
    sealScale: 1,
  };

  if (airborne) {
    const rising = clamp01(fighter.vy / 5.8);
    const falling = clamp01(-fighter.vy / 5.8);
    const apex = 1 - Math.max(rising, falling);
    pose.bodyX = -0.03 + rising * 0.12 - falling * 0.08;
    pose.leftHip = -0.35 - apex * 0.22 + falling * 0.18;
    pose.rightHip = 0.46 + apex * 0.12 - falling * 0.25;
    pose.leftKnee = 0.7 + apex * 0.3;
    pose.rightKnee = 0.76 + apex * 0.24;
    pose.leftShoulderX = -0.82 - rising * 0.38;
    pose.rightShoulderX = -0.95 - rising * 0.35;
    pose.leftElbow = -0.72;
    pose.rightElbow = -0.78;
  } else if (fighter.action === 'walk') {
    const stride = Math.sin(time * 10.5) * 0.74;
    pose.bodyY += Math.abs(Math.sin(time * 10.5)) * 0.045;
    pose.bodyX = 0.13;
    pose.leftHip = stride;
    pose.rightHip = -stride;
    pose.leftKnee = Math.max(0.08, -stride * 0.82);
    pose.rightKnee = Math.max(0.08, stride * 0.82);
    pose.leftShoulderX = -stride * 0.62;
    pose.rightShoulderX = stride * 0.62;
  }
  return pose;
}

function applyPunch(pose: CombatPose, fighter: FighterState) {
  const { windup, strike } = actionMotion(fighter.actionTime, 0.08, 0.11, 0.2);
  pose.bodyX += -0.08 * windup + 0.28 * strike;
  pose.bodyZ += -0.08 * windup + 0.1 * strike;
  pose.rightShoulderX += 0.92 * windup - 1.55 * strike;
  pose.rightShoulderZ += 0.26 * windup - 0.2 * strike;
  pose.rightElbow += -0.5 * windup + 0.58 * strike;
  pose.leftShoulderX -= 0.35 * strike;
  pose.leftElbow -= 0.28 * strike;
  if (fighter.y > 0) {
    pose.leftHip -= 0.18 * strike;
    pose.rightHip += 0.22 * strike;
  }
}

function applyKick(pose: CombatPose, fighter: FighterState) {
  const { windup, strike } = actionMotion(fighter.actionTime, 0.16, 0.14, 0.34);
  pose.bodyX += -0.12 * windup + 0.32 * strike;
  pose.bodyZ += -0.1 * windup + 0.15 * strike;
  pose.rightHip += 0.72 * windup - 1.72 * strike;
  pose.rightKnee += 0.92 * windup - 0.72 * strike;
  pose.leftHip += 0.22 * strike;
  pose.leftKnee += 0.36 * strike;
  pose.leftShoulderX -= 0.82 * strike;
  pose.rightShoulderX += 0.3 * windup - 0.52 * strike;
  pose.leftElbow -= 0.25 * strike;
  if (fighter.y > 0) {
    pose.bodyX += 0.18 * strike;
    pose.leftHip += 0.48 * strike;
    pose.leftKnee += 0.34 * strike;
  }
}

function applySpellCast(pose: CombatPose, fighter: FighterState) {
  const index = Math.max(0, Number(fighter.action.slice(-1)) - 1);
  const defaultTimings = [
    { startup: 0.3, active: 0.18, recovery: 0.35 },
    { startup: 0.42, active: 0.22, recovery: 0.48 },
    { startup: 0.62, active: 0.3, recovery: 0.72 },
  ][index];
  const timings = { ...defaultTimings, ...soilCombatTiming(fighter.spells[index]?.id), ...treeCombatTiming(fighter.spells[index]?.id), ...darkCombatTiming(fighter.spells[index]?.id) };
  const { windup, strike } = actionMotion(fighter.actionTime, timings.startup, timings.active, timings.recovery);
  const charge = Math.max(windup, strike);
  const spell = fighter.spells[index];
  if (spell?.element === 'healing' || spell?.element === 'time' || spell?.element === 'robot' || spell?.element === 'soil' || spell?.element === 'trees' || spell?.element === 'dark' || spell?.element === 'light' || spell?.element === 'space') {
    Object.assign(pose, (spell.element === 'healing' ? healingCastPose : spell.element === 'time' ? timeCastPose : spell.element === 'robot' ? robotCastPose : spell.element === 'space' ? spaceCastPose : spell.element === 'light' ? lightCastPose : spell.element === 'dark' ? darkCastPose : spell.element === 'trees' ? treeCastPose : soilCastPose)(spell.id, fighter.actionTime / (timings.startup + timings.active + timings.recovery)));
    pose.coreScale = 1 + charge * .2;
    pose.sealScale = 1 + charge * .12;
    return;
  }
  const castType = spell?.castType;
  pose.bodyX += -0.12 * windup + 0.22 * strike;
  pose.bodyY += Math.sin(clamp01(fighter.actionTime / timings.startup) * Math.PI) * 0.08;
  pose.coreScale = 1 + charge * (0.5 + index * 0.16);
  pose.sealScale = 1 + charge * (0.28 + index * 0.12);

  if (castType === 'shield') {
    pose.leftShoulderX = -0.55 - charge * 0.9;
    pose.rightShoulderX = -0.55 - charge * 0.9;
    pose.leftElbow = -0.7 - charge * 0.42;
    pose.rightElbow = -0.7 - charge * 0.42;
  } else if (castType === 'restore') {
    pose.leftShoulderX = -0.45 - charge * 0.85;
    pose.rightShoulderX = -0.45 - charge * 0.85;
    pose.leftShoulderZ = -0.08 - charge * 0.5;
    pose.rightShoulderZ = 0.08 + charge * 0.5;
    pose.leftElbow = -0.45;
    pose.rightElbow = -0.45;
  } else if (castType === 'mobility') {
    const spellAction = fighter.spells[index]?.action;
    pose.bodyX += -0.18 * windup + 0.34 * strike;
    pose.leftShoulderX = -0.65 - charge * 0.72;
    pose.rightShoulderX = -0.65 - charge * 0.72;
    pose.leftShoulderZ = -0.18 - charge * 0.3;
    pose.rightShoulderZ = 0.18 + charge * 0.3;
    pose.leftElbow = -0.9 + strike * 0.45;
    pose.rightElbow = -0.9 + strike * 0.45;
    pose.leftKnee += windup * 0.28;
    pose.rightKnee += windup * 0.28;
    if (spellAction === 'teleport') {
      if (fighter.actionTime < 0.26) {
        pose.bodyScale = 1 - smooth(fighter.actionTime / 0.26) * 0.72;
      } else if (fighter.actionTime > 0.42) {
        pose.bodyScale = 0.28 + smooth((fighter.actionTime - 0.42) / 0.28) * 0.72;
      } else {
        pose.bodyScale = 0.28;
      }
      pose.bodyZ += Math.sin(fighter.actionTime * 18) * 0.08 * charge;
    }
  } else if (castType === 'summon') {
    pose.bodyX += -0.16 * windup + 0.12 * strike;
    pose.leftShoulderX = -1.1 - charge * 1.12;
    pose.rightShoulderX = -0.7 - charge * 1.42;
    pose.leftShoulderZ = -0.18 - charge * 0.34;
    pose.rightShoulderZ = 0.18 + charge * 0.34;
    pose.leftElbow = -0.72;
    pose.rightElbow = -0.92;
  } else if (castType === 'control') {
    pose.leftShoulderX += 0.42 * windup - 1.18 * strike;
    pose.rightShoulderX += 0.42 * windup - 1.18 * strike;
    pose.leftShoulderZ = -0.12 - charge * 0.28;
    pose.rightShoulderZ = 0.12 + charge * 0.28;
    pose.leftElbow += -0.28 * windup + 0.44 * strike;
    pose.rightElbow += -0.28 * windup + 0.44 * strike;
  } else {
    pose.rightShoulderX += 0.55 * windup - 1.48 * strike;
    pose.rightElbow += -0.36 * windup + 0.56 * strike;
    pose.leftShoulderX -= 0.4 + charge * 0.28;
    pose.leftElbow -= 0.25 * charge;
  }
}

/** Smooth, frame-rate-independent posing with airborne attacks layered over the jump. */
export function applyCombatAnimation(
  char: StickMan3DCharacter,
  fighter: FighterState,
  time: number,
  delta: number,
): void {
  const pose = basePose(fighter, time);
  const action = fighter.action;
  let response = 15;

  if (action === 'punch') {
    applyPunch(pose, fighter);
    response = 22;
  } else if (action === 'kick') {
    applyKick(pose, fighter);
    response = 19;
  } else if (action.startsWith('spell')) {
    applySpellCast(pose, fighter);
    response = 13;
  } else if (action === 'hit' || action === 'knockdown') {
    const recoil = clamp01(fighter.hitStun / 0.55);
    pose.bodyX = action === 'knockdown' ? -1.05 : -0.38 * recoil;
    pose.bodyZ = Math.sin(time * 32) * 0.06 * recoil;
    pose.leftShoulderX = -0.08;
    pose.rightShoulderX = -0.08;
    pose.leftHip = -0.2;
    pose.rightHip = 0.38;
    pose.rightKnee = 0.72;
    response = 20;
  } else if (action === 'stasis') {
    pose.bodyX = 0.03;
    pose.bodyZ = 0;
    pose.leftShoulderX = -0.2;
    pose.rightShoulderX = -0.78;
    pose.leftElbow = -0.38;
    pose.rightElbow = -0.82;
    pose.leftHip = 0.08;
    pose.rightHip = -0.18;
    pose.leftKnee = 0.12;
    pose.rightKnee = 0.3;
    pose.coreScale = 1.35;
    pose.sealScale = 1.42;
    response = 28;
  } else if (action === 'fly') {
    const glide = Math.sin(time * 4.2);
    pose.bodyX = -0.2;
    pose.bodyY += glide * 0.025;
    pose.leftShoulderX = -0.92 + glide * 0.1;
    pose.rightShoulderX = -0.92 - glide * 0.1;
    pose.leftShoulderZ = 1.18;
    pose.rightShoulderZ = -1.18;
    pose.leftElbow = -0.22;
    pose.rightElbow = -0.22;
    pose.leftHip = 0.32;
    pose.rightHip = 0.08;
    pose.leftKnee = 0.48;
    pose.rightKnee = 0.28;
    pose.coreScale = 1.22;
    pose.sealScale = 1.18;
    response = 12;
  } else if (action === 'victory') {
    pose.bodyY += Math.abs(Math.sin(time * 5.5)) * 0.17;
    pose.leftShoulderX = -2.35;
    pose.rightShoulderX = -2.35;
    pose.leftElbow = -0.2;
    pose.rightElbow = -0.2;
  } else if (action === 'defeated') {
    pose.bodyX = -1.42;
    pose.bodyY = 0.16;
    pose.leftShoulderX = 0.15;
    pose.rightShoulderX = 0.15;
    response = 9;
  }

  if (fighter.rootTime > 0 && fighter.stasisTime <= 0) {
    pose.bodyY = .52;
    pose.leftHip = .1; pose.rightHip = -.1;
    pose.leftKnee = .24; pose.rightKnee = .24;
  }
  const body = char.bodyGroup;
  body.position.y = damp(body.position.y, pose.bodyY, delta, response);
  body.rotation.x = damp(body.rotation.x, pose.bodyX, delta, response);
  body.rotation.z = damp(body.rotation.z, pose.bodyZ, delta, response);
  const bodyScale = damp(body.scale.x, pose.bodyScale, delta, action.startsWith('spell') ? 22 : 15);
  body.scale.setScalar(bodyScale);
  char.leftArm.shoulder.rotation.x = damp(char.leftArm.shoulder.rotation.x, pose.leftShoulderX, delta, response);
  char.rightArm.shoulder.rotation.x = damp(char.rightArm.shoulder.rotation.x, pose.rightShoulderX, delta, response);
  char.leftArm.shoulder.rotation.z = damp(char.leftArm.shoulder.rotation.z, pose.leftShoulderZ, delta, response);
  char.rightArm.shoulder.rotation.z = damp(char.rightArm.shoulder.rotation.z, pose.rightShoulderZ, delta, response);
  char.leftArm.elbow.rotation.x = damp(char.leftArm.elbow.rotation.x, pose.leftElbow, delta, response);
  char.rightArm.elbow.rotation.x = damp(char.rightArm.elbow.rotation.x, pose.rightElbow, delta, response);
  char.leftLeg.hip.rotation.x = damp(char.leftLeg.hip.rotation.x, pose.leftHip, delta, response);
  char.rightLeg.hip.rotation.x = damp(char.rightLeg.hip.rotation.x, pose.rightHip, delta, response);
  char.leftLeg.knee.rotation.x = damp(char.leftLeg.knee.rotation.x, pose.leftKnee, delta, response);
  char.rightLeg.knee.rotation.x = damp(char.rightLeg.knee.rotation.x, pose.rightKnee, delta, response);

  updateSilenceMarker(char, fighter.silenceTime, time);
  updateArchangelMichael(char, fighter.archangelTime, time);
  updateFallenLucifer(char, fighter.demonTime, time, char.group.userData.poisonRadius);
  const coreScale = damp(char.powerCoreMesh.scale.x, pose.coreScale, delta, 12);
  char.powerCoreMesh.scale.setScalar(coreScale);
  const sealScale = damp(char.magicSealMesh.scale.x, pose.sealScale, delta, 11);
  char.magicSealMesh.scale.set(sealScale, sealScale, 1);
  updateHealingPower(char, time);
  updateTimePower(char, time, fighter.shieldTime > 0);
  updateSpacePower(char, time, fighter.shieldTime > 0);
  char.headElementGroup.userData.updateRobot?.(time);
  char.bodyElementGroup.userData.updateRobot?.(time);
  char.magicSealMesh.userData.updateRobot?.(time);
  char.magicSealMesh.userData.updateLight?.(time, .5);
  char.headElementGroup.userData.updateLight?.(time);
  char.bodyElementGroup.userData.updateLight?.(time);
  char.headElementGroup.userData.updateFire?.(time);
  char.headElementGroup.userData.updateWater?.(time);
  char.headElementGroup.userData.updateLightning?.(time);
  char.headElementGroup.userData.updateIce?.(time);
  char.headElementGroup.userData.updateWind?.(time);
  char.headElementGroup.userData.updateSoil?.(time);
  char.headElementGroup.userData.updateTrees?.(time);
  char.bodyElementGroup.userData.updateTrees?.(time);
  char.headElementGroup.userData.updateDark?.(time);
  char.bodyElementGroup.userData.updateDark?.(time);
  if (action !== 'stasis') {
    if (char.element !== 'robot' && char.element !== 'healing' && char.element !== 'soil' && char.element !== 'trees' && char.element !== 'dark' && char.element !== 'light' && char.element !== 'time' && char.element !== 'space') {
      char.headElementGroup.rotation.y += delta * 1.2;
      char.bodyElementGroup.rotation.y -= delta * 0.95;
    }
    if (char.element !== 'robot' && char.element !== 'healing' && char.element !== 'light' && char.element !== 'time' && char.element !== 'space') char.magicSealMesh.rotation.z += delta * (action.startsWith('spell') ? 4.4 : 0.72);
  }
  updateHandMagicSeal(
    char.handMagicSeal,
    action.startsWith('spell') || action === 'fly',
    time,
    delta,
    action === 'spell3' ? 1.24 : action === 'spell2' ? 1.12 : 1,
  );
}
