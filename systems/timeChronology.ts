import * as THREE from 'three';
import type { StickMan3DCharacter } from '../types';

export const TIME_INK = '#24958E';
export const TIME_BRASS = '#D79B50';
export const TIME_IVORY = '#FFF0CD';

function material(color: string, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
}

/** Physical dial: fixed graduations and independently pivoted hands, never a spinning seal. */
export function createChronometer(radius: number) {
  const root = new THREE.Group(); root.name = 'time-chronometer';
  const brass = material(TIME_BRASS), ink = material(TIME_INK), ivory = material(TIME_IVORY);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * .035, 6, 80), brass); root.add(rim);
  const transform = new THREE.Object3D();
  for (const major of [true, false]) {
    const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(radius * (major ? .035 : .014), radius * (major ? .16 : .065), radius * .03), major ? brass : ink, major ? 12 : 48);
    marks.name = major ? 'time-hour-graduations' : 'time-second-graduations';
    let index = 0;
    for (let i = 0; i < 60; i++) {
      if ((i % 5 === 0) !== major) continue;
      const a = i * Math.PI / 30;
      transform.position.set(Math.sin(a) * radius * .88, Math.cos(a) * radius * .88, 0);
      transform.rotation.z = -a; transform.updateMatrix(); marks.setMatrixAt(index++, transform.matrix);
    }
    marks.instanceMatrix.needsUpdate = true; root.add(marks);
  }
  const hands = [.46, .72, .82].map((length, i) => {
    const pivot = new THREE.Group(); pivot.name = ['time-hour-hand', 'time-minute-hand', 'time-second-hand'][i];
    const hand = new THREE.Mesh(new THREE.BoxGeometry(radius * (i === 2 ? .015 : .04), radius * length, radius * .035), i === 2 ? ink : ivory);
    hand.position.set(0, radius * length / 2, radius * (.05 + i * .025)); pivot.add(hand); root.add(pivot); return pivot;
  });
  root.add(new THREE.Mesh(new THREE.SphereGeometry(radius * .055, 10, 8), brass));
  return { root, update: (time: number, direction = 1) => {
    hands[0].rotation.z = -.8 - direction * time * .12;
    hands[1].rotation.z = .65 - direction * time * .72;
    hands[2].rotation.z = -direction * Math.floor(time * 6) * Math.PI / 30;
  } };
}

/** Transparent glass reveals the sand and its direction of travel. */
export function createTemporalHourglass(size: number) {
  const root = new THREE.Group(); root.name = 'time-temporal-hourglass';
  const brass = material(TIME_BRASS), sand = material(TIME_IVORY), glass = material(TIME_INK, .13);
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(size * .36, size * .36, size * .08, 16), brass);
    cap.position.y = side * size * .65; root.add(cap);
    const bulb = new THREE.Mesh(new THREE.ConeGeometry(size * .3, size * .6, 20, 1, true), glass);
    bulb.position.y = side * size * .3; if (side > 0) bulb.rotation.z = Math.PI; root.add(bulb);
  }
  for (const x of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(size * .04, size * 1.3, size * .04), brass);
    post.position.x = x * size * .34; root.add(post);
  }
  const piles = [-1, 1].map(side => {
    const pile = new THREE.Mesh(new THREE.ConeGeometry(size * .23, size * .3, 16), sand);
    pile.position.y = side * size * .46; if (side > 0) pile.rotation.z = Math.PI; root.add(pile); return pile;
  });
  const grains = Array.from({ length: 9 }, () => {
    const grain = new THREE.Mesh(new THREE.BoxGeometry(size * .023, size * .023, size * .023), sand); root.add(grain); return grain;
  });
  return { root, update: (time: number, reverse = false) => {
    const phase = (time * .22) % 1, p = reverse ? 1 - phase : phase;
    piles[0].scale.setScalar(.3 + p * .7); piles[1].scale.setScalar(1 - p * .7);
    grains.forEach((grain, i) => { const u = (i / grains.length + time * .8) % 1; grain.position.y = (reverse ? u - .5 : .5 - u) * size * .55; });
  } };
}

export function createTimePalm(facingTarget: THREE.Object3D) {
  const dial = createChronometer(.29), glass = createTemporalHourglass(.14);
  const root = new THREE.Group(); root.name = 'hand-magic-seal-time'; root.visible = false;
  root.add(dial.root, glass.root); glass.root.position.set(0, 0, .07);
  root.userData.timeSeal = { facingTarget, activation: 0, update: (time: number) => { dial.update(time, -1); glass.update(time, true); } };
  return root;
}

export function updateTimePower(char: StickMan3DCharacter, time: number, shielded = false) {
  if (char.element !== 'time') return;
  char.headElementGroup.userData.updateTime?.(time);
  char.bodyElementGroup.userData.updateTime?.(time, shielded);
  char.magicSealMesh.userData.updateTime?.(time);
  for (const mesh of [char.powerBeamMesh, char.shockwaveMesh]) {
    const opacity = (mesh.material as THREE.Material).opacity;
    mesh.children.forEach(child => { child.visible = opacity > .01; child.traverse(node => {
      if (node instanceof THREE.Mesh && node.material instanceof THREE.MeshBasicMaterial) {
        const m = node.material; m.userData.timeOpacity ??= m.opacity; m.opacity = m.userData.timeOpacity * opacity;
      }
    }); });
    mesh.userData.updateTime?.(time);
  }
}
