import { updateHealingPower } from './healingVitality';
import { updateTimePower } from './timeChronology';
import { updateSpacePower } from './spaceCosmos';
import * as THREE from 'three';
import { StickMan3DCharacter } from '../types';

/**
 * Updates an articulated 3D stick man's procedural joint animations,
 * locomotion across the website, head and body elemental FX, and spell actions.
 */
export function updateStickManAnimation(
  char: StickMan3DCharacter,
  timeSec: number,
  deltaSec: number,
  cursorNormX: number,
  cursorNormY: number
): void {
  char.animTime += deltaSec;
  const t = char.animTime;

  // ── 1. Clash of Clans-Style Troop Locomotion & Ground Patrol ───────
  const dist = char.group.position.distanceTo(char.targetPosition);
  const isMoving = dist > 0.15 && char.castAnimationTime <= 0;

  if (isMoving) {
    char.mood = 'running';
    char.walkCycle += deltaSec * 8.2; // Natural Clash of Clans troop march cadence

    const dir = new THREE.Vector3()
      .subVectors(char.targetPosition, char.group.position)
      .normalize();

    // Troop speed: steady, determined stride
    const moveSpeed = 0.040;
    char.group.position.addScaledVector(dir, moveSpeed);

    // Smoothly turn body in direction of march
    const targetYaw = Math.atan2(dir.x, dir.z);
    char.group.rotation.y = THREE.MathUtils.lerp(char.group.rotation.y, targetYaw, 0.14);

    // Forward march lean
    char.bodyGroup.rotation.x = 0.16;
    char.bodyGroup.rotation.z = -dir.x * 0.08;

    // Rhythmic marching bounce
    const walkBounce = Math.abs(Math.sin(char.walkCycle)) * 0.06;
    char.bodyGroup.position.y = 0.55 + walkBounce;

    // ── Leg Marching Cycle ─────────────────────────────
    const legSwing = Math.sin(char.walkCycle) * 0.78;
    char.leftLeg.hip.rotation.x = legSwing;
    char.rightLeg.hip.rotation.x = -legSwing;

    // Natural knee bend on backstroke
    char.leftLeg.knee.rotation.x = Math.max(0, -legSwing) * 0.95;
    char.rightLeg.knee.rotation.x = Math.max(0, legSwing) * 0.95;

    // ── Arm Marching Counter-Swing (Symmetrical natural stick figure walk) ──
    const armSwing = Math.cos(char.walkCycle) * 0.65;
    char.leftArm.shoulder.rotation.x = -armSwing;
    char.rightArm.shoulder.rotation.x = armSwing;
    char.rightArm.shoulder.rotation.z = 0;

    char.leftArm.elbow.rotation.x = -0.4 - Math.max(0, armSwing) * 0.4;
    char.rightArm.elbow.rotation.x = -0.4 - Math.max(0, -armSwing) * 0.4;
  } else {
    // ── Idle / Station Guard State ──────────────────────
    char.mood = 'idle';
    char.walkCycle = 0;

    // Smooth return to standing upright
    char.bodyGroup.rotation.x = THREE.MathUtils.lerp(char.bodyGroup.rotation.x, 0, 0.12);
    char.bodyGroup.rotation.z = THREE.MathUtils.lerp(char.bodyGroup.rotation.z, 0, 0.12);

    // Subtle idle breathing
    const idleBob = Math.sin(t * 2.2) * 0.02;
    char.bodyGroup.position.y = 0.55 + idleBob;

    // Natural guard stance
    char.leftLeg.hip.rotation.x = THREE.MathUtils.lerp(char.leftLeg.hip.rotation.x, 0.04, 0.1);
    char.rightLeg.hip.rotation.x = THREE.MathUtils.lerp(char.rightLeg.hip.rotation.x, -0.04, 0.1);
    char.leftLeg.knee.rotation.x = THREE.MathUtils.lerp(char.leftLeg.knee.rotation.x, 0.06, 0.1);
    char.rightLeg.knee.rotation.x = THREE.MathUtils.lerp(char.rightLeg.knee.rotation.x, 0.06, 0.1);

    // Guard arms: Relaxed natural stick figure posture
    char.leftArm.shoulder.rotation.x = Math.sin(t * 1.6) * 0.06 + 0.1;
    char.rightArm.shoulder.rotation.x = -Math.sin(t * 1.6) * 0.06 + 0.1;
    char.rightArm.shoulder.rotation.z = 0;
    char.leftArm.elbow.rotation.x = -0.35;
    char.rightArm.elbow.rotation.x = -0.45;

    // Head tracks cursor subtly or looks around the district
    if (cursorNormX > -100) {
      const lookYaw = THREE.MathUtils.clamp(cursorNormX * 0.6 - char.group.rotation.y, -0.8, 0.8);
      char.headMesh.rotation.y = THREE.MathUtils.lerp(char.headMesh.rotation.y, lookYaw, 0.08);
    } else {
      char.headMesh.rotation.y = Math.sin(t * 0.7) * 0.35;
    }

    // Rally point reached check
    if (char.isRallyMoving) {
      char.isRallyMoving = false;
      char.castAnimationTime = 0.45; // Victory salute hop
    }

    // Advance patrol waypoint across ground district
    char.wanderTimer -= deltaSec;
    if (char.wanderTimer <= 0 && char.castAnimationTime <= 0) {
      if (char.patrolWaypoints && char.patrolWaypoints.length > 0) {
        char.waypointIdx = (char.waypointIdx + 1) % char.patrolWaypoints.length;
        const nextPt = char.patrolWaypoints[char.waypointIdx];
        char.targetPosition.copy(nextPt);
        char.wanderTimer = 2.5 + Math.random() * 3.5; // Pause at destination to inspect village
      } else {
        // Local district wander
        char.wanderTimer = 3.5 + Math.random() * 5.0;
        char.targetPosition.set(
          char.group.position.x + (Math.random() - 0.5) * 3.5,
          char.baseY,
          char.group.position.z + (Math.random() - 0.5) * 3.5
        );
      }
    }
  }

  // ── 2. Chest Power Core & Head Power Animation ────────────────────
  // Pulsing chest core
  const corePulse = 1.0 + Math.sin(t * 4.5) * 0.22;
  char.powerCoreMesh.scale.set(corePulse, corePulse, corePulse);

  // Animate orbiting elemental vortexes, waves, rocks, embers, or planetary rings
  updateSpacePower(char, t);
  char.headElementGroup.userData.updateRobot?.(t);
  char.bodyElementGroup.userData.updateRobot?.(t);
  char.magicSealMesh.userData.updateRobot?.(t);
  char.magicSealMesh.userData.updateLight?.(t, .5);
  char.headElementGroup.userData.updateLight?.(t);
  char.bodyElementGroup.userData.updateLight?.(t);
  char.headElementGroup.userData.updateFire?.(t);
  char.headElementGroup.userData.updateWater?.(t);
  char.headElementGroup.userData.updateLightning?.(t);
  char.headElementGroup.userData.updateIce?.(t);
  char.headElementGroup.userData.updateWind?.(t);
  char.headElementGroup.userData.updateSoil?.(t);
  char.headElementGroup.userData.updateTrees?.(t);
  char.bodyElementGroup.userData.updateTrees?.(t);
  char.headElementGroup.userData.updateDark?.(t);
  char.bodyElementGroup.userData.updateDark?.(t);
  const orbitFX = char.headElementGroup.getObjectByName('head-orbit-fx');
  if (orbitFX) {
    orbitFX.rotation.y += deltaSec * 2.0;
  }
  updateTimePower(char, timeSec);
  const timeGear = char.headElementGroup.getObjectByName('time-gear-halo');
  if (timeGear) {
    timeGear.rotation.z += deltaSec * 1.2;
  }

  // Rotate body power (waist ring, cosmic shards)
  if (char.element !== 'robot' && char.element !== 'healing' && char.element !== 'soil' && char.element !== 'trees' && char.element !== 'dark' && char.element !== 'light' && char.element !== 'time' && char.element !== 'space') char.bodyElementGroup.rotation.y -= deltaSec * 1.1;

  // Steady, firm weapon grip in hand

  // ── 3. Magic Seal Continuous Ground Rotation ──────────────────────
  const sealSpinSpeed = char.castAnimationTime > 0 ? 0.08 : 0.015;
  if (char.element !== 'healing' && char.element !== 'robot' && char.element !== 'light' && char.element !== 'time' && char.element !== 'space') char.magicSealMesh.rotation.z += sealSpinSpeed;

  // ── 4. Ground Shadow Contact Scaling ──────────────────────────────
  const curY = char.bodyGroup.position.y;
  const shadowScale = Math.max(0.3, 1.15 - curY * 0.4);
  char.shadowMesh.scale.set(shadowScale, shadowScale, 1);
  (char.shadowMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(
    0.15,
    0.7 - (curY - 0.55) * 0.6
  );

  // ── 5. Special Cast Animation (Somersault / Super Move / Tap Reaction) ──
  if (char.castAnimationTime > 0) {
    char.castAnimationTime -= deltaSec * 1.35;
    const progress = Math.max(0, 1.0 - char.castAnimationTime);

    // 3D High vertical ninja jump
    const jumpApex = Math.sin(progress * Math.PI) * 2.2;
    char.bodyGroup.position.y = 0.55 + jumpApex;

    if (char.element === 'time') {
      const pulse = Math.sin(progress * Math.PI);
      char.bodyGroup.position.y = .55;
      char.bodyGroup.rotation.x = -.12 * pulse;
      char.rightArm.shoulder.rotation.x = -1.4 * pulse;
      char.rightArm.elbow.rotation.x = -1.1 * pulse;
      char.leftArm.shoulder.rotation.z = -.6 * pulse;
      (char.powerBeamMesh.material as THREE.Material).opacity = pulse * .65;
      (char.shockwaveMesh.material as THREE.Material).opacity = pulse * .5;
      char.shockwaveMesh.scale.setScalar(1 + pulse * .3);
      updateTimePower(char, timeSec);
      return;
    }

    if (char.element === 'soil' || char.element === 'trees' || char.element === 'dark' || char.element === 'light') {
      char.bodyGroup.position.y = .55 - Math.sin(progress * Math.PI) * .08;
      char.bodyGroup.rotation.x = Math.sin(progress * Math.PI) * .3;
      char.leftLeg.knee.rotation.x = .18 + Math.sin(progress * Math.PI) * .3;
      char.rightLeg.knee.rotation.x = .18 + Math.sin(progress * Math.PI) * .3;
      char.rightArm.shoulder.rotation.x = -.8 + progress * .8;
      char.leftArm.shoulder.rotation.x = -.8 + progress * .8;
      (char.powerBeamMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      (char.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      return;
    }

    if (char.element === 'healing') {
      // Grounded, open-handed restoration instead of the generic acrobatic attack.
      const pulse = Math.sin(progress * Math.PI);
      char.bodyGroup.position.y = .55 + pulse * .035;
      char.bodyGroup.rotation.x = -.08 * pulse;
      char.leftArm.shoulder.rotation.x = char.rightArm.shoulder.rotation.x = -.9 * pulse;
      char.leftArm.elbow.rotation.x = char.rightArm.elbow.rotation.x = -.55;
      (char.powerBeamMesh.material as THREE.Material).opacity = pulse * .65;
      (char.shockwaveMesh.material as THREE.Material).opacity = pulse * .45;
      char.shockwaveMesh.scale.setScalar(1 + pulse * .25);
      updateHealingPower(char, timeSec);
      return;
    }

    if (char.element === 'robot') {
      char.bodyGroup.position.y = .55 - Math.sin(progress * Math.PI) * .035;
      char.bodyGroup.rotation.x = -.12 * Math.sin(progress * Math.PI);
      char.leftArm.shoulder.rotation.x = char.rightArm.shoulder.rotation.x = -1.2 * Math.sin(progress * Math.PI);
      (char.powerBeamMesh.material as THREE.Material).opacity = 0;
      (char.shockwaveMesh.material as THREE.Material).opacity = 0;
      return;
    }

    // Full 360° Acrobatic Somersault Backflip!
    char.bodyGroup.rotation.x = Math.sin(progress * Math.PI) * Math.PI * 2;
    char.bodyGroup.rotation.y += deltaSec * 6.0;

    // Dynamic Kung Fu kick pose at jump apex
    if (progress > 0.3 && progress < 0.7) {
      char.rightLeg.hip.rotation.x = -1.6; // High kick
      char.leftLeg.hip.rotation.x = 0.8;
      char.rightArm.shoulder.rotation.x = -1.4; // Punch strike
    }

    // Magic seal flares up
    const sealScale = 1.0 + Math.sin(progress * Math.PI) * 2.0;
    char.magicSealMesh.scale.set(sealScale, sealScale, 1);
    (char.magicSealMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;

    // Summoning Light Beam bursts skyward
    const beamAlpha = Math.sin(progress * Math.PI) * 0.85;
    (char.powerBeamMesh.material as THREE.MeshBasicMaterial).opacity = beamAlpha;
    char.powerBeamMesh.rotation.y += 0.08;

    // Ground Shockwave ripple
    const waveScale = 1.0 + progress * 6.5;
    char.shockwaveMesh.scale.set(waveScale, waveScale, 1);
    (char.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity =
      Math.max(0, 1.0 - progress) * 0.9;

    if (char.castAnimationTime <= 0) {
      char.magicSealMesh.scale.set(1, 1, 1);
      (char.magicSealMesh.material as THREE.MeshBasicMaterial).opacity = 0.75;
      (char.powerBeamMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      (char.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      char.bodyGroup.rotation.x = 0;
    }
  }
  updateHealingPower(char, timeSec);
}
