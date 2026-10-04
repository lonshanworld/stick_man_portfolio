import * as THREE from 'three';
import type { StickMan3DCharacter } from '../types';

export const HEALING_ROSE = '#E9699C';
export const HEALING_MINT = '#87C99B';
export const HEALING_PEARL = '#FFF0F5';

/** A rounded, solid heart with depth: healing owns this silhouette at every scale. */
export function createHealingHeartGeometry(size: number) {
  const s = new THREE.Shape();
  s.moveTo(0, -size * .65);
  s.bezierCurveTo(-size * 1.3, size * .15, -size * .85, size * 1.1, 0, size * .45);
  s.bezierCurveTo(size * .85, size * 1.1, size * 1.3, size * .15, 0, -size * .65);
  const geometry = new THREE.ExtrudeGeometry(s, { depth: size * .16, bevelEnabled: true,
    bevelSize: size * .06, bevelThickness: size * .05, bevelSegments: 2, steps: 1, curveSegments: 14 });
  geometry.translate(0, 0, -size * .08);
  return geometry;
}

export function createHealingCrossGeometry(size: number) {
  const s = new THREE.Shape(), a = size * .3;
  const points = [[-a,-size],[a,-size],[a,-a],[size,-a],[size,a],[a,a],[a,size],[-a,size],[-a,a],[-size,a],[-size,-a],[-a,-a]];
  points.forEach(([x,y], i) => i ? s.lineTo(x,y) : s.moveTo(x,y)); s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: size * .2, bevelEnabled: false });
}

export function createHealingBoundaryGeometry(radius: number) {
  const contour = (scale: number) => Array.from({ length: 97 }, (_, i) => {
    const a = i / 96 * Math.PI * 2;
    return new THREE.Vector2(16 * Math.pow(Math.sin(a), 3) / 18 * radius * scale,
      (13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a)) / 18 * radius * scale);
  });
  const shape = new THREE.Shape(contour(1)); shape.holes.push(new THREE.Path(contour(.95)));
  const geometry = new THREE.ShapeGeometry(shape);
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, .5 + uv.getX(i)/(radius*2), .5 + uv.getY(i)/(radius*2));
  return geometry;
}

export function healingBeat(time: number) {
  const p = (time * 1.15) % 1;
  return Math.exp(-Math.pow((p - .16) / .07, 2)) + .55 * Math.exp(-Math.pow((p - .34) / .09, 2));
}

/** Healer's heart and a sutured seam. No plant crown, rotating runes, or energy rings. */
export function createHealingEmblem(size: number) {
  const root = new THREE.Group(); root.name = 'healing-vital-heart';
  const rose = new THREE.MeshBasicMaterial({ color: HEALING_ROSE, transparent: true, depthWrite: false, toneMapped: false });
  const pearl = rose.clone(); pearl.color.set(HEALING_PEARL);
  const heart = new THREE.Mesh(createHealingHeartGeometry(size), rose); root.add(heart);
  const cross = new THREE.Mesh(createHealingCrossGeometry(size * .28), pearl); cross.position.z = size * .18; root.add(cross);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const stitch = new THREE.Mesh(new THREE.BoxGeometry(size * .28, size * .07, size * .08), pearl);
    stitch.position.set(side * size * (.95 + i * .22), (i - 1) * size * .21, 0);
    stitch.rotation.z = side * .35; root.add(stitch);
  }
  return { root, update: (time: number, opacity = 1) => {
    heart.scale.setScalar(1 + healingBeat(time) * .12);
    rose.opacity = opacity; pearl.opacity = opacity;
  } };
}

export function createHealingPalm(facingTarget: THREE.Object3D) {
  const emblem = createHealingEmblem(.21), root = new THREE.Group();
  root.name = 'hand-magic-seal-healing'; root.visible = false; root.add(emblem.root);
  root.userData.healingSeal = { facingTarget, activation: 0, update: emblem.update };
  return root;
}

export function updateHealingPower(char: StickMan3DCharacter, time: number) {
  if (char.element !== 'healing') return;
  char.headElementGroup.userData.updateHealing?.(time);
  char.bodyElementGroup.userData.updateHealing?.(time);
  char.magicSealMesh.userData.updateHealing?.(time);
  for (const mesh of [char.powerBeamMesh, char.shockwaveMesh]) {
    const opacity = (mesh.material as THREE.Material).opacity;
    mesh.children.forEach(child => { child.visible = opacity > .01; });
    mesh.userData.updateHealing?.(time, opacity);
  }
}
