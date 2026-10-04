import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, ease, type Point } from './spellDrawing';
import { createChronometer, createTemporalHourglass, TIME_BRASS, TIME_INK, TIME_IVORY } from './timeChronology';

function register(d: SpellDrawing, root: THREE.Object3D) {
  d.root.add(root);
  const materials = new Set<THREE.MeshBasicMaterial>();
  root.traverse(node => { if (node instanceof THREE.Mesh && node.material instanceof THREE.MeshBasicMaterial) materials.add(node.material); });
  materials.forEach(m => { m.userData.opacity = m.opacity; d.materials.push(m); });
}

function timeline(d: SpellDrawing, y: number, z: number) {
  const ink = d.material(TIME_INK, .65), brass = d.material(TIME_BRASS, .9);
  d.line([[-65, y, z], [65, y, z]], .25, ink).name = 'time-history-axis';
  for (let i = 0; i < 25; i++) {
    const x = -60 + i * 5;
    d.line([[x, y - (i % 5 ? 1 : 3), z], [x, y + (i % 5 ? 1 : 3), z]], .2, brass);
  }
}

function echo(d: SpellDrawing, opacity: number) {
  const root = new THREE.Group(); root.name = 'time-recorded-pose'; d.root.add(root);
  const ink = d.material(TIME_INK, opacity);
  d.mesh(new THREE.TorusGeometry(4.5, .35, 5, 24), ink, root).position.y = 48;
  for (const points of [ [[0, 42, 0], [0, 23, 0]], [[-13, 30, 0], [0, 38, 0], [13, 30, 0]], [[-10, 3, 0], [0, 23, 0], [10, 3, 0]] ] as Point[][]) d.line(points, .4, ink, root);
  return root;
}

/** Reverse playback crosses recorded silhouettes, with clock hands running backward. */
export function buildChronoRewind(spell: ElementalSpell) {
  const d = new SpellDrawing(spell), dial = createChronometer(27);
  register(d, dial.root); dial.root.position.set(0, 31, -6);
  timeline(d, 5, 3);
  for (let i = 0; i < 5; i++) {
    const pose = echo(d, .18 + i * .09);
    const hourglass = createTemporalHourglass(3); register(d, hourglass.root);
    hourglass.root.position.set(-52 + i * 26, 66, 0);
    d.motions.push((t, p) => {
      const playback = 1 - ease(p);
      pose.position.set((i - 2) * 22 + playback * 14, 0, 4 + i * 2);
      pose.scale.setScalar(.8 + .2 * ease(t / .25));
      hourglass.update(t, true);
    });
  }
  const cursor = d.line([[-3, 0, 0], [0, 4, 0], [3, 0, 0]], .7, d.material(TIME_IVORY));
  cursor.name = 'time-reverse-playhead';
  d.motions.push((t, p) => { dial.update(t * 2, -1); dial.root.scale.setScalar(ease(t / .25)); cursor.position.set(60 - 120 * ease(p), 7, 4); });
  return d.finish();
}

/** A timekeeper owl jumps between discrete moments; its wings are graduated clock hands. */
export function buildGearBarrage(spell: ElementalSpell) {
  const d = new SpellDrawing(spell), owl = new THREE.Group(); owl.name = 'time-epoch-owl'; d.root.add(owl);
  const brass = d.material(TIME_BRASS), ink = d.material(TIME_INK), ivory = d.material(TIME_IVORY);
  d.line([[-10, 5, 0], [-8, -9, 0], [0, -15, 0], [8, -9, 0], [10, 5, 0], [10, 15, 0], [3, 9, 0], [-3, 9, 0], [-10, 15, 0], [-10, 5, 0]], .65, brass, owl);
  for (const side of [-1, 1]) {
    const eye = createChronometer(4.2); owl.add(eye.root); eye.root.position.set(side * 4.8, 4.5, 1);
    // Register the eye materials for lifetime fading without moving it out of the owl.
    const wing = new THREE.Group(); wing.position.set(side * 9, 0, 0); owl.add(wing);
    d.line([[0, 0, 0], [side * 22, 8, 0], [side * 15, -7, 0], [0, -10, 0]], .55, ink, wing);
    for (let j = 0; j < 6; j++) d.line([[side * (4 + j * 2.5), -7, 0], [side * (5 + j * 2.5), 4, 0]], .3, brass, wing);
    d.motions.push(t => { eye.update(t * 1.7, side); wing.rotation.z = side * Math.sin(Math.floor(t * 8) / 8 * 5) * .24; });
    register(d, eye.root); owl.add(eye.root);
  }
  const glass = createTemporalHourglass(5); register(d, glass.root); owl.add(glass.root); glass.root.position.y = -4;
  d.line([[-2, 1, 3], [0, -3, 3], [2, 1, 3]], .55, ivory, owl);
  timeline(d, 42, -5);
  for (let i = 0; i < 4; i++) {
    const frame = createChronometer(8); register(d, frame.root); frame.root.position.set(-48 + i * 32, 65, -7);
    d.motions.push(t => { frame.update(i * .7); frame.root.scale.setScalar(ease((t - i * .08) / .25)); });
  }
  d.motions.push(t => { const moment = Math.floor(t * 6) / 6; owl.position.set(-28 + moment * 32, 66 + Math.sin(moment * 3) * 5, 5); owl.scale.setScalar(ease(t / .3)); glass.update(t); });
  return d.finish();
}

/** A stopped second: fixed clock hands and sand held in mid-fall inside a tall hourglass cage. */
export function buildStasisField(spell: ElementalSpell) {
  const d = new SpellDrawing(spell), dial = createChronometer(33), glass = createTemporalHourglass(34);
  register(d, dial.root); register(d, glass.root);
  dial.root.position.set(0, 33, -12); glass.root.position.y = 33;
  const brass = d.material(TIME_BRASS, .65), ivory = d.material(TIME_IVORY, .85);
  for (const side of [-1, 1]) {
    d.line([[side * 23, 60, 0], [side * 5, 33, 0], [side * 23, 6, 0]], .45, brass).name = 'time-stasis-boundary';
    const pause = d.mesh(new THREE.BoxGeometry(2, 8, 1), ivory); pause.position.set(side * 3, 72, 0);
  }
  for (let i = 0; i < 24; i++) {
    const grain = d.mesh(new THREE.BoxGeometry(.65, .65, .65), ivory); grain.name = 'time-suspended-grain';
    d.motions.push(t => { const stopped = Math.min(t, .65); grain.position.set(Math.sin(i * 2.4) * (5 + i % 6 * 3), 10 + i * 1.8 - stopped * 6, Math.cos(i * 2.4) * 13); });
  }
  d.motions.push(t => { const stopped = Math.min(t, .65); dial.update(stopped * 3); glass.update(stopped); const scale = ease(t / .3); dial.root.scale.setScalar(scale); glass.root.scale.setScalar(scale); });
  return d.finish();
}
