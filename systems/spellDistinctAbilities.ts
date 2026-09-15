import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, TAU, clamp, ease, noise, polar, type Point, type BuiltSpellEffect } from './spellDrawing';

// Each ability owns its geometry, timing, and motion. Only drawing primitives are shared.
export function buildPyroclasticSurge(spell: ElementalSpell, heading: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading);
  for (let i = 0; i < 9; i++) {
    const delay = 0.08 + i * 0.085;
    const position = (t: number): Point => {
      const p = clamp((t - delay) / 0.9);
      return [(i % 3 - 1) * (5 + p * 22), 24 + Math.sin(p * Math.PI) * (20 + i % 3 * 5), 14 + p * 185];
    };
    const ball = new THREE.Group(); d.root.add(ball);
    d.mote([0, 0, 0], 3.2, d.primary, ball);
    d.mote([0, 0.5, 1.3], 1.8, d.secondary, ball);
    d.halo([0, 0, 0], 11, '#ff7400', ball, 0.5);
    for (let j = 0; j < 3; j++) d.stroke((u, t) => [Math.sin(u * 5 - t * 12 + j * 2) * u * 2.3, Math.cos(j * 2) * u * 2, -u * (9 + j * 2)], 0.65, j ? d.primary : d.secondary, ball, 18);
    const tail = d.stroke((u, t) => { const p = position(t - u * 0.18); p[1] += Math.sin(u * 9 - t * 11 + i) * u * 2; return p; }, 1.1, d.primary);
    const core = d.stroke((u, t) => position(t - u * 0.1), 0.35, d.secondary);
    d.motions.push(t => { ball.position.set(...position(t)); ball.visible = tail.visible = core.visible = t >= delay && t < delay + 0.9; });
    d.burst(delay + 0.9, position(delay + 0.9), 15, 10);
  }
  return d.finish();
}

export function buildWhirlpoolVortex(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  // Flowing water shield: a curved vertical surface, not a ground vortex.
  for (let i = 0; i < 10; i++) {
    d.stroke((u, t) => { const x = (i - 4.5) * 5.5; return [x + Math.sin(u * 7 - t * 3 + i) * 2, 7 + u * (54 - Math.abs(x) * 0.65), 25 + Math.sin(u * Math.PI) * 12]; }, i % 3 ? 0.35 : 0.65, i % 2 ? d.primary : d.secondary);
  }
  d.stroke((u, t) => [(u - 0.5) * 60, 40 + Math.sin(u * Math.PI) * 22 + Math.sin(u * 9 - t * 3), 25], 0.7, d.secondary);
  d.particles(45, (i, t) => { const x = (noise(i) - 0.5) * 56, p = (noise(i + 3) + t * 0.5) % 1; return [x + Math.sin(p * 7 + i) * 2, 7 + p * (54 - Math.abs(x) * 0.65), 25 + Math.sin(p * Math.PI) * 12]; }, 0.85, d.white);
  d.motions.push(t => { d.root.scale.setScalar(ease(t / 0.4)); });
  return d.finish();
}

export function buildPlasmaRailgun(spell: ElementalSpell, heading: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading);
  for (let i = 0; i < 9; i++) {
    const delay = i * 0.07, speed = 270 + i % 3 * 25;
    const position = (t: number): Point => { const age = Math.max(0, t - delay); return [(i % 3 - 1) * (4 + age * 20), 22 + i % 2 * 9, 12 + age * speed]; };
    const bolt = d.stroke((u, t) => {
      const p = position(t - u * 0.16), k = Math.floor(u * 16);
      p[0] += (noise(k * 7 + i + Math.floor(t * 24)) - 0.5) * 7 * Math.sin(u * Math.PI);
      p[1] += Math.sin(k * 17 + i) * 1.6;
      return p;
    }, 0.6, d.secondary, d.root, 64);
    const fork = d.stroke((u, t) => { const p = position(t - 0.035 - u * 0.07); p[0] += u * (i % 2 ? -8 : 8); p[1] += Math.sin(Math.floor(u * 7) * 9) * 2; return p; }, 0.25, d.white);
    const head = d.star([0, 0, 0], 1.8, d.white);
    d.motions.push(t => { head.position.set(...position(t)); head.visible = bolt.visible = fork.visible = t > delay && t < delay + 0.75; });
    d.burst(delay + 0.75, position(delay + 0.75), 10, 8);
  }
  return d.finish();
}

export function buildBlizzardVortex(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), glass = d.material('#91e8ff', 0.19);
  // Separate diamond facets leave space between the panes and readable icy edges.
  for (let i = 0; i < 13; i++) {
    const a = i * 2.399, r = i === 0 ? 0 : 0.45 + noise(i) * 0.5;
    const x = Math.cos(a) * r * 25, y = 34 + Math.sin(a) * r * 30, z = 28 + (1 - r) * 8;
    const pane = new THREE.Group(); d.root.add(pane);
    const points: Point[] = [[0, 9, 0], [5, 0, 0], [0, -9, 0], [-5, 0, 0], [0, 9, 0]];
    const shape = new THREE.Shape(points.slice(0, 4).map(p => new THREE.Vector2(p[0], p[1])));
    d.mesh(new THREE.ShapeGeometry(shape), glass, pane);
    d.line(points, 0.4, d.secondary, pane);
    d.line([[-3, 2, 0.2], [0, 0, 0.2], [2, -5, 0.2]], 0.2, d.white, pane);
    d.motions.push(t => { const p = ease((t - i * 0.025) / 0.5); pane.position.set(x * (2 - p), y, z); pane.scale.setScalar(p); pane.rotation.y = (1 - p) * 2 + x * 0.015; });
  }
  d.particles(35, (i, t) => [(noise(i) - 0.5) * 55, 5 + (noise(i + 5) * 65 + t * 8) % 65, 30], 0.55, d.white);
  return d.finish();
}

export function buildAeroShockwave(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (let i = 0; i < 5; i++) d.stroke((u, t) => {
    const a = i * TAU / 5 + u * 2.4 - t * 4;
    const lift = Math.sin(clamp(t / spell.duration) * Math.PI) * 38;
    return polar(a, 8 + u * 14, u * (12 + lift));
  }, 0.45, i % 2 ? d.secondary : d.primary);
  for (let i = 0; i < 12; i++) {
    const leaf = d.leaf(1.5, d.secondary);
    d.motions.push(t => { const p = (i / 12 + t * 0.5) % 1; leaf.position.set(...polar(i * 2.399 - t * 3, 15 + p * 8, p * 42)); leaf.rotation.set(t, i + t * 2, t * 3); });
  }
  return d.finish();
}

export function buildBoulderCatapult(spell: ElementalSpell, heading: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading), stone = d.material('#a98d6a');
  const hand = new THREE.Group(); d.root.add(hand);
  // An open palm made of small knuckles rather than one massive cuboid.
  for (let i = 0; i < 9; i++) {
    const pebble = d.mote([(i % 3 - 1) * 4, Math.floor(i / 3) * 5, 0], 2.5, stone, hand);
    pebble.scale.set(1, 1.3, 0.7);
  }
  const fingers: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const finger = new THREE.Group(); finger.position.set((i - 2) * 4.6, i === 0 ? 4 : 12, 0); hand.add(finger);
    if (i === 0) finger.rotation.z = 0.8;
    for (let j = 0; j < 3; j++) { const bone = d.mote([0, j * 4.5 + 2, 0], 1.8, stone, finger); bone.scale.y = 1.4; }
    d.line([[0, 0, 1.3], [0, 12, 1.3]], 0.2, d.secondary, finger);
    fingers.push(finger);
  }
  d.motions.push(t => { const rise = ease(t / 0.55), slam = ease((t - 0.8) / 0.3); hand.position.set(0, 5 + rise * 13 - slam * 13, slam * 13); hand.rotation.x = slam * 1.5; hand.scale.setScalar(rise); fingers.forEach((finger, i) => { finger.rotation.x = ease((t - 0.5) / 0.3) * 1.5; if (i) finger.rotation.z = (i - 2) * 0.08; }); });
  d.burst(1.05, [0, 3, 18], 35, 45, stone);
  return d.finish();
}

export function buildIronwoodSlam(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (const side of [-1, 1]) {
    d.stroke((u, t) => { const p = u * ease(t / 0.8); return [side * Math.cos(p * Math.PI / 2) * 28, p * 76, -4 + Math.sin(p * 5) * 3]; }, 1.1, d.primary);
    for (let i = 0; i < 9; i++) {
      const u = (i + 1) / 10, x = side * Math.cos(u * Math.PI / 2) * 28, y = u * 76;
      const twig = d.line([[x, y, -4], [x + side * 10, y + 7, -2]], 0.45, d.primary);
      const leaf = d.leaf(3.2, d.secondary); leaf.position.set(x + side * 7, y + 4, -1); leaf.rotation.z = -side * 0.8;
      d.motions.push(t => { twig.visible = t > u * 0.8; leaf.scale.setScalar(ease((t - u * 0.8) / 0.25)); });
    }
  }
  d.particles(25, (i, t) => [(noise(i) - 0.5) * 60, 8 + (noise(i + 6) * 70 - t * 9 + 100) % 70, 8], 0.65);
  return d.finish();
}

export function buildDarkEclipseNova(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), shadow = d.material('#412453', 0.8);
  for (let i = 0; i < 17; i++) {
    const a = i * TAU / 17;
    d.stroke((u, t) => { const wrap = ease(t / 0.45); const r = 6 + u * (15 + Math.sin(t * 3 + i) * 2); return polar(a + u * 0.4 + (1 - wrap) * 2, r, 62 - u * 53); }, 1.2, i % 4 ? shadow : d.primary);
  }
  d.particles(45, (i, t) => polar(i * 2.399 + t * 1.5, 13 + noise(i) * 15, (noise(i) * 70 + t * 17) % 70), 0.7, d.secondary);
  return d.finish();
}

export function buildSunburstLance(spell: ElementalSpell, heading: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading), spear = new THREE.Group(); d.root.add(spear);
  d.line([[0, 0, -22], [0, 0, 20]], 0.55, d.white, spear);
  const tip = d.mesh(new THREE.OctahedronGeometry(1), d.secondary, spear); tip.scale.set(1.5, 1, 9); tip.position.z = 18;
  for (let i = 0; i < 5; i++) for (const side of [-1, 1]) d.line([[0, 0, 5 - i * 4], [side * (6 - i * 0.7), 0, -3 - i * 4]], 0.45, d.primary, spear);
  d.halo([0, 0, 12], 9, '#fff2a0', spear);
  const position = (t: number): Point => [7, 37 + Math.sin(clamp(t / 0.4) * Math.PI) * 5, 15 + ease((t - 0.42) / 0.7) * 210];
  const trail = d.stroke((u, t) => position(t - u * 0.14), 0.3, d.secondary);
  d.motions.push(t => { spear.position.set(...position(t)); spear.scale.setScalar(ease(t / 0.35)); spear.visible = t < 1.15; trail.visible = t > 0.42 && t < 1.2; });
  d.burst(1.12, [7, 37, 225], 27, 32);
  return d.finish();
}

export function buildSupernovaFlare(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (const side of [-1, 1]) for (let i = 0; i < 11; i++) {
    d.stroke((u, t) => { const open = ease(t / 0.55); return [side * (4 + u * (34 - i * 1.7)) * open, 43 + Math.sin(u * Math.PI * 0.7) * (25 - i * 4), 23 - Math.sin(u * Math.PI) * 8]; }, 0.8, i % 3 ? d.secondary : d.white);
  }
  const star = d.star([0, 42, 25], 4.5, d.white);
  d.halo([0, 42, 25], 14, '#ffe6a0', d.root, 0.25);
  d.motions.push(t => { star.scale.setScalar(ease(t / 0.3)); });
  d.particles(30, (i, t) => [(noise(i) - 0.5) * 65, 12 + (noise(i + 2) * 55 + t * 12) % 55, 25], 0.65);
  return d.finish();
}

export function buildMeteorShower(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  const well = d.star([0, 8, 0], 4, d.secondary);
  for (let i = 0; i < 12; i++) {
    const position = (t: number): Point => { const p = (noise(i) + t * 0.32) % 1; return polar(i * 2.399 + p * 3, 6 + (1 - p) * 43, 8 + (1 - p) * (30 + noise(i + 9) * 25)); };
    const fragment = d.mesh(new THREE.OctahedronGeometry(1.6), i % 2 ? d.primary : d.secondary);
    d.stroke((u, t) => position(t - u * 0.22), 0.3, d.primary);
    d.motions.push(t => { fragment.position.set(...position(t)); fragment.rotation.set(t + i, t * 2, i); });
  }
  for (let i = 0; i < 6; i++) d.stroke((u, t) => { const a = i * TAU / 6; return polar(a + u * u + t * 0.15, u * 47, 2 + u * u * 9); }, 0.25, d.secondary);
  d.motions.push(t => { well.rotation.z = -t; });
  return d.finish();
}

export const PORTAL_DISTANCE = 190;
export function buildCosmicRay(spell: ElementalSpell, heading: number, distance = PORTAL_DISTANCE): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading);
  for (let i = 0; i < 2; i++) {
    const gate = new THREE.Group(); gate.position.z = i * distance; gate.rotation.y = -heading; d.root.add(gate);
    for (let j = 0; j < 3; j++) d.stroke((u, t) => { const a = u * TAU * 0.82 + t * (i ? -1 : 1) + j * 2; return [Math.cos(a) * (16 + j * 1.5), 32 + Math.sin(a) * (32 + j), 0]; }, j ? 0.3 : 0.7, j % 2 ? d.primary : d.secondary, gate);
    for (let j = 0; j < 12; j++) d.star([Math.cos(j * 2.399) * 15, 32 + Math.sin(j * 2.399) * 28, 0], 1.3, d.white, gate);
    d.motions.push(t => { gate.scale.setScalar(ease((t - i * 0.12) / 0.35) * (1 - ease((t - spell.duration * 0.8) / (spell.duration * 0.2)))); });
  }
  d.particles(55, (i, t) => { const p = clamp((t - 0.4 - noise(i) * 0.14) / 0.5); return [Math.sin(i * 2.399) * 5 * Math.sin(p * Math.PI), 25 + Math.cos(i * 2.399) * 8, p * distance]; }, 0.8, d.secondary);
  return d.finish();
}

export function buildGearBarrage(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), owl = new THREE.Group(); d.root.add(owl);
  d.line([[-9, 5, 0], [-7, -8, 0], [0, -13, 0], [7, -8, 0], [9, 5, 0]], 0.7, d.primary, owl);
  d.line([[-9, 4, 0], [-10, 13, 0], [-3, 8, 0], [3, 8, 0], [10, 13, 0], [9, 4, 0]], 0.65, d.secondary, owl);
  for (const side of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(side * 4.5, 4, 1); owl.add(eye);
    const points: Point[] = Array.from({ length: 33 }, (_, j) => { const a = j / 32 * TAU, r = j % 4 < 2 ? 3.8 : 3.1; return [Math.cos(a) * r, Math.sin(a) * r, 0]; });
    d.line(points, 0.35, d.secondary, eye); d.mote([0, 0, 0], 1.1, d.white, eye);
    const wing = new THREE.Group(); wing.position.set(side * 8, 1, 0); owl.add(wing);
    for (let j = 0; j < 5; j++) d.line([[0, 0, 0], [side * (15 - j * 2), 6 - j * 4, 0], [side * 4, -6 - j * 2, 0]], 0.4, d.primary, wing);
    d.motions.push(t => { eye.rotation.z = side * t * 2; wing.rotation.y = side * (0.2 + Math.sin(t * 7) * 0.45); });
  }
  d.line([[-2, 0, 1], [0, -4, 1], [2, 0, 1]], 0.5, d.white, owl);
  d.motions.push(t => { owl.position.set(22 + Math.sin(t * 1.8) * 8, 69 + Math.sin(t * 4) * 3, 0); owl.scale.setScalar(ease(t / 0.5)); });
  return d.finish();
}

export function buildHyperBeam(spell: ElementalSpell, heading: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading);
  for (const side of [-1, 1]) {
    const beam = d.stroke((u, t) => [side * 10 * (1 - u * 0.7), 30, 8 + u * 180 * ease((t - 0.2) / 0.2)], 0.48, d.secondary);
    const core = d.stroke((u, t) => [side * 10 * (1 - u * 0.7), 30, 8 + u * 180 * ease((t - 0.2) / 0.2)], 0.18, d.white);
    d.halo([side * 10, 30, 9], 6, '#46ecff');
    d.motions.push(t => { beam.visible = core.visible = t > 0.2 && Math.sin(t * 22) > -0.6; });
  }
  d.line([[-6, 30, 188], [6, 30, 188]], 0.35);
  d.line([[0, 24, 188], [0, 36, 188]], 0.35);
  d.particles(20, (i, t) => [(noise(i) - 0.5) * 10, 30 + Math.sin(i + t * 9) * 5, 184 + noise(i + 3) * 8], 0.6, d.white);
  return d.finish();
}

export function buildOverclockGrid(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), metal = d.material('#a3bcca');
  for (const side of [-1, 1]) {
    const drone = new THREE.Group(); d.root.add(drone);
    const body = d.mote([0, 0, 0], 3, metal, drone); body.scale.set(1.7, 0.65, 1);
    d.mote([0, 0, 2.5], 1.1, d.secondary, drone);
    for (const wing of [-1, 1]) {
      d.line([[wing * 2, 0, 0], [wing * 8, 1, 0]], 0.5, metal, drone);
      d.line([[wing * 8 - 3, 1, 0], [wing * 8 + 3, 1, 0]], 0.25, d.secondary, drone);
    }
    const position = (t: number): Point => [side * (24 + Math.sin(t * 2) * 3), 40 + Math.sin(t * 3 + side) * 12, 6];
    d.stroke((u, t) => { const start = position(t); return [start[0] * (1 - u), start[1] * (1 - u) + u * (25 + Math.sin(t * 4) * 9), 6]; }, 0.28, d.secondary);
    d.motions.push(t => { drone.position.set(...position(t)); drone.scale.setScalar(ease(t / 0.4)); });
  }
  for (let i = 0; i < 7; i++) {
    const cross = new THREE.Group(); d.root.add(cross);
    d.line([[-1.7, 0, 0], [1.7, 0, 0]], 0.3, d.secondary, cross); d.line([[0, -1.7, 0], [0, 1.7, 0]], 0.3, d.secondary, cross);
    d.motions.push(t => { cross.position.set(Math.sin(i * 2.399) * 12, 14 + (t * 18 + i * 7) % 45, 9); });
  }
  return d.finish();
}

export function buildMissileSalvo(spell: ElementalSpell, heading: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading), metal = d.material('#a4becd');
  for (let i = 0; i < 8; i++) {
    const delay = i * 0.095;
    const position = (t: number): Point => { const p = clamp((t - delay) / 1.05); return [(i % 2 ? -1 : 1) * (12 + Math.sin(p * Math.PI) * 22), 23 + Math.sin(p * Math.PI) * 65, 6 + p * p * 190]; };
    const rocket = new THREE.Group(); d.root.add(rocket);
    const body = d.mesh(new THREE.OctahedronGeometry(1), metal, rocket); body.scale.set(1.4, 1.4, 6);
    d.line([[-3, 0, -4], [0, 0, -2], [3, 0, -4]], 0.7, d.secondary, rocket);
    d.halo([0, 0, -6], 6, '#3adfff', rocket, 0.5);
    const exhaust = d.stroke((u, t) => { const p = position(t - u * 0.18); p[0] += Math.sin(u * 14 + i) * u; return p; }, 0.4, d.secondary);
    const direction = new THREE.Vector3();
    d.motions.push(t => { const p = position(t), q = position(t + 0.005); rocket.position.set(...p); direction.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]); if (direction.lengthSq() > 0.001) rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.normalize()); rocket.visible = exhaust.visible = t > delay && t < delay + 1.05; });
    d.burst(delay + 1.05, position(delay + 1.05), 15, 12);
  }
  return d.finish();
}

export function buildPetalBreeze(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), moth = new THREE.Group(); d.root.add(moth);
  const body = d.mote([0, 0, 0], 1.4, d.secondary, moth); body.scale.y = 3;
  for (const side of [-1, 1]) {
    const wing = new THREE.Group(); moth.add(wing);
    const upper = d.petal(5, d.primary, wing); upper.rotation.z = side * -0.8;
    const lower = d.petal(3.5, d.secondary, wing); lower.rotation.z = side * -2;
    d.line([[side, 3, 0], [side * 4, 8, 0], [side * 5, 7, 0]], 0.2, d.white, moth);
    d.motions.push(t => { wing.rotation.y = side * Math.sin(t * 12) * 0.8; });
  }
  const path = (t: number): Point => [Math.cos(t * 2) * 28, 46 + Math.sin(t * 3) * 13, Math.sin(t * 2) * 12];
  d.halo([0, 0, 0], 15, '#ffa0d8', moth, 0.25);
  d.motions.push(t => { moth.position.set(...path(t)); moth.rotation.z = Math.sin(t * 2) * 0.25; moth.scale.setScalar(ease(t / 0.4)); });
  d.particles(40, (i, t) => { const p = path(Math.max(0, t - i * 0.018)); p[1] -= noise(i) * 12; p[0] += (noise(i + 3) - 0.5) * 6; return p; }, 0.65, d.secondary);
  return d.finish();
}

export function buildDimensionalSlash(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (const side of [-1, 1]) {
    const slash = d.stroke((u, t) => { const close = ease((t - 0.3) / 0.3); return [(u - 0.5) * 58, 30 + side * (u - 0.5) * 44, (1 - close) * side * 20 + Math.sin(u * Math.PI) * 3]; }, 0.8, d.primary);
    d.stroke((u) => [(u - 0.5) * 58, 30 + side * (u - 0.5) * 44 + 0.6, Math.sin(u * Math.PI) * 3], 0.2, d.secondary);
    d.motions.push(t => { slash.scale.setScalar(ease(t / 0.25) * (1 - ease((t - 1) / 0.7))); });
  }
  d.burst(0.6, [0, 30, 0], 36, 38);
  return d.finish();
}

export function buildVoidCollapse(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (const side of [-1, 1]) d.stroke((u, t) => { const close = ease((t - 0.3) / 1.3); return [side * Math.sin(u * Math.PI) * 13 * (1 - close), 8 + u * 65, Math.sin(u * 18) * 1.4]; }, 0.65, d.primary);
  for (let i = 0; i < 12; i++) {
    const y = 10 + i * 5;
    const stitch = d.stroke((u, t) => { const close = ease((t - 0.3) / 1.3), width = Math.sin(i / 12 * Math.PI) * 13 * (1 - close); return [(u - 0.5) * width * 2, y + Math.sin(u * Math.PI) * 2, 1]; }, 0.25, d.secondary);
    d.motions.push(t => { stitch.visible = t > i * 0.08 && t < 1.75; });
  }
  d.particles(45, (i, t) => { const p = ease(t / 1.5); return [(noise(i) - 0.5) * 60 * (1 - p), 8 + noise(i + 1) * 65, (noise(i + 7) - 0.5) * 24 * (1 - p)]; }, 0.7);
  return d.finish();
}
