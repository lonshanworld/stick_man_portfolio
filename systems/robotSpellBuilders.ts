import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, ease, clamp, type BuiltSpellEffect } from './spellDrawing';

const STEEL = '#92A2B0', DARK = '#25343F', CYAN = '#37DFEA';
function box(d: SpellDrawing, parent: THREE.Object3D, name: string, size: [number, number, number], at: [number, number, number], color = STEEL) {
  const mesh = d.mesh(new THREE.BoxGeometry(...size), d.material(color), parent);
  mesh.name = name; mesh.position.set(...at); return mesh;
}

/** Physical launcher and collimated light; no magical ribbons or rune rings. */
export function buildHyperBeam(spell: ElementalSpell, heading = 0, distance = 190): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading);
  d.root.name = 'robot-twin-laser-platform';
  const reach = Math.max(20, distance);
  for (const side of [-1, 1]) {
    const gun = new THREE.Group(); gun.name = 'robot-laser-emitter'; gun.userData.combatContact = false; gun.position.set(side * 10, 30, 0); d.root.add(gun);
    box(d, gun, 'armored-cannon-housing', [8, 8, 17], [0, 0, 0], DARK);
    box(d, gun, 'barrel-shroud', [5, 5, 12], [0, 0, 10]);
    box(d, gun, 'square-collimator-lens', [3.5, 3.5, 1], [0, 0, 16.5], CYAN);
    for (let i = 0; i < 4; i++) box(d, gun, 'cooling-fin', [10, 1, 2], [0, -3 + i * 2, -4]);
    const beam = box(d, d.root, 'collimated-laser', [1.1, 1.1, 1], [side * 10, 30, 17], CYAN);
    const core = box(d, beam, 'laser-hot-core', [.3, .3, 1.01], [0, 0, 0], '#D4FFFF');
    core.renderOrder = 3;
    d.motions.push((t, p) => {
      const firing = p > .2 && p < .78;
      const length = (reach - 17) * ease((p - .2) / .09);
      beam.visible = firing; beam.scale.z = Math.max(.001, length); beam.position.z = 17 + length / 2;
      gun.position.z = firing ? -Math.abs(Math.sin(t * 28)) * 2 : 0;
    });
  }
  const reticle = new THREE.Group(); reticle.name = 'robot-target-lock'; reticle.position.set(0, 30, reach); d.root.add(reticle);
  reticle.userData.combatContact = false;
  for (const x of [-1, 1]) for (const y of [-1, 1]) {
    box(d, reticle, 'target-bracket-horizontal', [5, .7, .7], [x * 10, y * 11, 0], '#FFAA48');
    box(d, reticle, 'target-bracket-vertical', [.7, 5, .7], [x * 12, y * 9, 0], '#FFAA48');
  }
  d.motions.push((_t, p) => { reticle.visible = p > .08 && p < .82; reticle.scale.setScalar(1.2 - ease(p / .2) * .2); });
  return d.finish();
}

/** Quadrotor maintenance bots, tools and a rectangular diagnostic scan. */
export function buildOverclockGrid(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell); d.root.name = 'robot-maintenance-swarm';
  for (const side of [-1, 1]) {
    const drone = new THREE.Group(); drone.name = 'robot-repair-drone'; d.root.add(drone);
    box(d, drone, 'drone-chassis', [12, 5, 9], [0, 0, 0]);
    box(d, drone, 'drone-camera', [5, 2, 1], [0, 0, 5], DARK);
    box(d, drone, 'camera-optics', [3, 1, .5], [0, 0, 5.7], CYAN);
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      box(d, drone, 'rotor-arm', [10, 1, 1], [x * 7, 0, z * 5], DARK);
      const rotor = box(d, drone, 'drone-propeller', [10, .5, 1], [x * 12, 2, z * 5], DARK);
      d.motions.push(t => { rotor.rotation.y = t * 42 * x; });
    }
    box(d, drone, 'repair-manipulator', [1, 7, 1], [-side * 4, -5, 0], DARK);
    box(d, drone, 'welder-tip', [2, 2, 2], [-side * 4, -9, 0], CYAN);
    const link = box(d, d.root, 'repair-data-link', [.45, .45, 1], [0, 0, 0], CYAN);
    const axis = new THREE.Vector3(0, 0, 1), end = new THREE.Vector3(), start = new THREE.Vector3(), delta = new THREE.Vector3();
    d.motions.push((t, p) => {
      drone.position.set(side * 32, 41 + Math.sin(t * 3 + side) * 5, 0);
      drone.scale.setScalar(ease(p / .14));
      start.copy(drone.position).add(new THREE.Vector3(-side * 4, -9, 0)); end.set(0, 20 + (t * 13) % 24, 4);
      delta.subVectors(end, start); link.position.copy(start).add(end).multiplyScalar(.5);
      link.scale.z = delta.length(); link.quaternion.setFromUnitVectors(axis, delta.normalize());
    });
  }
  const scan = box(d, d.root, 'diagnostic-scan-line', [23, .7, 1], [0, 20, 6], CYAN);
  for (const side of [-1, 1]) box(d, d.root, 'diagnostic-rail', [.7, 43, 1], [side * 14, 29, 5], DARK);
  d.motions.push(t => { scan.position.y = 9 + (t * 23) % 40; });
  return d.finish();
}

/** Cylindrical ordnance with ogive noses, four fins, hot exhaust and local impacts. */
export function buildMissileSalvo(spell: ElementalSpell, heading = 0, distance = 190): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading); d.root.name = 'robot-guided-missile-salvo';
  const reach = Math.max(20, distance), forward = new THREE.Vector3(0, 0, 1), tangent = new THREE.Vector3();
  for (const side of [-1, 1]) {
    const rack = box(d, d.root, 'missile-launch-rack', [7, 9, 10], [side * 13, 26, 0], DARK);
    rack.userData.combatContact = false;
    for (let j = 0; j < 3; j++) box(d, rack, 'rack-rear-exhaust-vent', [5, .6, .5], [0, (j - 1) * 2, -5.1]);
    for (let j = 0; j < 4; j++) box(d, rack, 'launch-cell', [2, 2, 1], [(j % 2 ? 1 : -1) * 1.6, (j < 2 ? -1 : 1) * 2.1, 5.1]);
  }
  for (let i = 0; i < 8; i++) {
    const launch = .08 + i * .042, hit = launch + .42, side = i % 2 ? -1 : 1;
    const path = (p: number) => new THREE.Vector3(side * (13 * (1 - p) + Math.sin(p * Math.PI) * 20) + (i % 4 - 1.5) * p * 3,
      26 + Math.sin(p * Math.PI) * (30 + i % 3 * 7) - p * 5, p * reach);
    const missile = new THREE.Group(); missile.name = 'robot-guided-missile'; d.root.add(missile);
    const body = d.mesh(new THREE.CylinderGeometry(1.65, 1.65, 10, 12), d.material(STEEL), missile);
    body.name = 'missile-cylindrical-fuselage'; body.rotation.x = Math.PI / 2;
    const nose = d.mesh(new THREE.ConeGeometry(1.65, 4.5, 12), d.material(DARK), missile);
    nose.name = 'missile-pointed-nose'; nose.rotation.x = Math.PI / 2; nose.position.z = 7.25;
    box(d, missile, 'missile-identification-band', [3.4, 3.4, .8], [0, 0, 2.5], '#E3B15C');
    for (let j = 0; j < 4; j++) {
      const fin = box(d, missile, 'missile-tail-fin', [3, .4, 4], [0, 0, 0], DARK);
      const a = j * Math.PI / 2; fin.position.set(Math.cos(a) * 2, Math.sin(a) * 2, -3.6); fin.rotation.z = a;
    }
    const flame = d.mesh(new THREE.ConeGeometry(1.25, 7, 8), d.material('#FFAA48'), missile);
    flame.name = 'missile-engine-exhaust'; flame.rotation.x = -Math.PI / 2; flame.position.z = -8.5;
    const smoke = new THREE.Group(); smoke.name = 'missile-smoke-trail'; d.root.add(smoke);
    const puffs = Array.from({ length: 7 }, () => {
      const m = d.mesh(new THREE.SphereGeometry(1, 8, 6), d.material('#778088', .26), smoke); return m;
    });
    const impact = new THREE.Group(); impact.name = 'missile-small-explosion'; impact.position.copy(path(1)); d.root.add(impact);
    const flash = d.mesh(new THREE.SphereGeometry(1, 12, 8), d.material('#FFB349', .95), impact);
    flash.name = 'compact-impact-flash';
    const soot = Array.from({ length: 5 }, (_, j) => {
      const m = d.mesh(new THREE.SphereGeometry(1, 8, 6), d.material('#58616A', .55), impact);
      m.name = 'impact-smoke'; m.position.set(Math.cos(j * 2.4) * 2, j, Math.sin(j * 2.4) * 2); return m;
    });
    const shards = Array.from({ length: 7 }, () => box(d, impact, 'impact-hot-fragment', [.5, .5, 1.5], [0, 0, 0], '#E98635'));
    d.motions.push((t, p) => {
      const flight = clamp((p - launch) / .42), pos = path(flight);
      missile.visible = p >= launch && p < hit; missile.position.copy(pos);
      tangent.copy(path(Math.min(1, flight + .002))).sub(path(Math.max(0, flight - .002))).normalize();
      if (tangent.lengthSq() > .01) missile.quaternion.setFromUnitVectors(forward, tangent);
      flame.scale.y = .85 + Math.sin(t * 45 + i) * .15;
      smoke.visible = p > launch && p < hit + .06;
      puffs.forEach((m, j) => { m.position.copy(path(clamp(flight - (j + 1) * .023))); m.scale.setScalar(1 + j * .25); });
      const age = (p - hit) / .16; impact.visible = age >= 0 && age < 1;
      flash.scale.setScalar(1 + Math.sin(clamp(age) * Math.PI) * 6);
      (flash.material as THREE.MeshBasicMaterial).opacity = age >= 0 && age < 1 ? (1 - age) * .95 : 0;
      soot.forEach((m, j) => { m.scale.setScalar(1 + clamp(age) * 3); m.position.y = j + clamp(age) * 7; });
      shards.forEach((m, j) => { const r = clamp(age) * 10; m.position.set(Math.cos(j * 2.4) * r, Math.sin(j * 3.7) * r - 4 * age * age, Math.sin(j * 2.4) * r); });
    });
  }
  return d.finish();
}
