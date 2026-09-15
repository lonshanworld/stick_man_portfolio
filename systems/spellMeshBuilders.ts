import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, TAU, clamp, ease, noise, polar, type Point, type BuiltSpellEffect } from './spellDrawing';
export type { BuiltSpellEffect } from './spellDrawing';

function emberHead(d: SpellDrawing, parent: THREE.Object3D, size = 3) {
  d.halo([0, 0, 0], size * 4, d.spell.primaryColor || '#ff7300', parent, 0.55);
  const ember = d.mote([0, 0, 0], size, d.primary, parent);
  ember.scale.set(1, 0.85, 1.3);
  d.mote([0, 0.8, 0.9], size * 0.58, d.secondary, parent);
  d.mote([0, 1, 1.4], size * 0.26, d.white, parent);
}



function crystal(d: SpellDrawing, parent: THREE.Object3D, height: number, width = 2) {
  const shard = d.mesh(new THREE.OctahedronGeometry(1), d.primary, parent);
  shard.scale.set(width, height / 2, width * 0.7);
  shard.position.y = height / 2;
  d.line([[0, 0, width * 0.75], [-width * 0.3, height * 0.5, width * 0.75], [0, height, 0]], 0.28, d.white, parent);
}

function petals(d: SpellDrawing, count: number, path: (i: number, t: number) => Point, size = 1.8) {
  for (let i = 0; i < count; i++) {
    const petalSize = size * (0.65 + noise(i) * 0.5), material = i % 4 ? d.primary : d.secondary;
    const petal = d.spell.element === 'healing' ? d.petal(petalSize, material) : d.leaf(petalSize, material);
    d.motions.push(t => {
      petal.position.set(...path(i, t));
      petal.rotation.set(Math.sin(t * 2 + i) * 0.6, t * 1.4 + i, t + i * 2.4);
    });
  }
}

// FIRE: a colossal phoenix apparition, a staggered fireball volley, and a meteor impact.
export function buildPhoenixFirestorm(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  const phoenix = new THREE.Group();
  d.root.add(phoenix);
  d.halo([0, 48, 0], 56, '#ff3d00', phoenix, 0.38);
  d.halo([0, 54, 2], 32, '#ffb700', phoenix, 0.48);

  // Central body, crown, and long flame tail.
  d.stroke((u, t) => [Math.sin(u * 7 - t * 7) * (2 + u * 4), 16 + u * 62, Math.sin(u * 4) * 5], 3.8, d.primary, phoenix);
  d.stroke((u, t) => [Math.sin(u * 6 - t * 8) * 2, 34 + u * 40, 3], 1.7, d.secondary, phoenix);
  const head = d.mote([0, 80, 2], 6.5, d.primary, phoenix);
  head.scale.set(1.2, 0.9, 1);
  d.mote([0, 82, 8], 2.8, d.secondary, phoenix);

  // Layered wings create a readable giant firebird silhouette.
  for (const side of [-1, 1]) {
    for (let feather = 0; feather < 7; feather++) {
      d.stroke((u, t) => {
        const spread = 30 + feather * 6;
        const flap = Math.sin(t * 5.5 + feather * 0.28) * (6 + u * 6);
        return [
          side * u * spread,
          63 - u * (10 + feather * 2.8) + flap,
          -feather * 1.6 + Math.sin(u * Math.PI) * 7,
        ];
      }, feather < 2 ? 3.4 : 2.2, feather % 2 ? d.primary : d.secondary, phoenix);
    }
  }

  // A wide ground firestorm rolls away beneath the phoenix.
  for (let i = 0; i < 18; i++) {
    const angle = i * TAU / 18;
    d.stroke((u, t) => {
      const radius = u * (32 + noise(i) * 40) * ease(t / 0.8);
      return [
        Math.cos(angle) * radius,
        Math.sin(u * Math.PI) * (19 + noise(i + 4) * 25) + Math.sin(u * 9 - t * 10 + i) * 4,
        Math.sin(angle) * radius,
      ];
    }, i % 3 === 0 ? 2.6 : 1.5, i % 2 ? d.primary : d.secondary);
  }
  d.particles(120, (i, t) => {
    const rise = (noise(i + 2) + t * 0.72) % 1;
    return polar(i * 2.399 + t * 1.5, 14 + noise(i) * 66, rise * 95);
  }, 1.4);
  d.burst(0.72, [0, 38, 0], 75, 72, d.primary);
  d.motions.push((t) => {
    const arrival = 0.28 + ease(t / 0.5) * 0.72;
    phoenix.scale.setScalar(arrival);
    phoenix.position.y = -24 + ease(t / 0.65) * 24 + Math.sin(t * 4) * 3;
  });
  return d.finish();
}



export function buildDragonMeteor(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  const impact = 1.08;
  const target: Point = [0, 3, 24];
  const pos = (t: number): Point => {
    const p = ease(t / impact);
    return [target[0] + (1 - p) * 92, target[1] + (1 - p * p) * 210, target[2] - (1 - p) * 72];
  };
  const head = new THREE.Group();
  d.root.add(head);
  emberHead(d, head, 9);
  d.mote([0, 0, 0], 6, d.secondary, head);
  const trail = d.stroke((u, t) => pos(t - u * 0.46), 4, d.primary);
  const core = d.stroke((u, t) => pos(t - u * 0.34), 1.6, d.secondary);
  const hotCore = d.stroke((u, t) => pos(t - u * 0.22), 0.7, d.white);
  d.motions.push(t => {
    head.position.set(...pos(t));
    head.rotation.z = t * 8;
    head.visible = trail.visible = core.visible = hotCore.visible = t < impact;
  });

  d.burst(impact, target, 90, 100, d.primary);
  d.burst(impact + 0.05, [0, 18, 24], 70, 72, d.secondary);
  d.burst(impact + 0.12, [0, 28, 24], 52, 48, d.white);

  // Expanding ground shockwaves make the ultimate fill the battlefield.
  for (let ringIndex = 0; ringIndex < 3; ringIndex++) {
    const ringMaterial = d.material(ringIndex === 1 ? '#ffd600' : '#ff3d00', 0.72, true);
    const ring = d.mesh(new THREE.RingGeometry(26, 32, 72), ringMaterial);
    ring.position.set(...target);
    ring.rotation.x = -Math.PI / 2;
    d.motions.push((t) => {
      const p = clamp((t - impact - ringIndex * 0.1) / 0.75);
      ring.visible = p > 0 && p < 1;
      ring.scale.setScalar(0.25 + p * (2.2 + ringIndex * 0.35));
      ringMaterial.opacity = ringMaterial.userData.opacity * (1 - p);
    });
  }

  for (let j = 0; j < 12; j++) {
    const angle = j * TAU / 12;
    const arc = d.stroke((u, t) => {
      const p = clamp((t - impact) / 0.9);
      return [
        target[0] + Math.cos(angle) * u * 78 * p,
        Math.sin(u * Math.PI) * 38 * (1 - p) + Math.sin(u * 8 + j) * 4,
        target[2] + Math.sin(angle) * u * 78 * p,
      ];
    }, j % 3 === 0 ? 1.6 : 0.95, j % 2 ? d.primary : d.secondary);
    d.motions.push(t => { arc.visible = t > impact && t < impact + 0.9; });
  }
  return d.finish();
}

// WATER: an open curling crest, a draining spiral, and separate arcing jets.
export function buildTidalSurge(spell: ElementalSpell, headingAngle: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, headingAngle);
  for (let i = 0; i < 9; i++) {
    d.stroke((u, t) => {
      const a = u * Math.PI * 1.45;
      return [(i - 4) * 5 + Math.sin(u * 6 + i) * 2, 4 + (1 - Math.cos(a)) * 21, 20 + t * 65 + Math.sin(a) * 22];
    }, i % 3 === 0 ? 0.95 : 0.45, i % 3 === 0 ? d.secondary : d.primary);
  }
  d.particles(60, (i, t) => [(noise(i) - 0.5) * 50, 12 + Math.abs(Math.sin(i + t * 3)) * 28, 28 + t * 65 + noise(i + 9) * 25], 0.8, d.white);
  return d.finish();
}

export function buildOceanicGeyser(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (let i = 0; i < 11; i++) {
    const a = i * 2.399;
    d.stroke((u, t) => polar(a + Math.sin(t * 3 + i) * 0.15, u * u * 32, Math.sin(u * Math.PI * 0.83) * (58 + noise(i) * 25)), i % 3 ? 0.5 : 1.1, i % 2 ? d.primary : d.secondary);
  }
  d.particles(65, (i, t) => {
    const p = (noise(i) + t * 0.65) % 1;
    return polar(i * 2.399, p * p * 39, Math.sin(p * Math.PI) * 82);
  }, 0.9);
  return d.finish();
}

function lightning(d: SpellDrawing, from: Point, to: Point, seed: number, width = 0.65) {
  const bolt = d.stroke((u, t) => {
    const k = Math.floor(u * 16), flicker = Math.floor(t * 18);
    const envelope = Math.sin(Math.PI * u);
    return [THREE.MathUtils.lerp(from[0], to[0], u) + (noise(k + seed + flicker) - 0.5) * 10 * envelope,
      THREE.MathUtils.lerp(from[1], to[1], u),
      THREE.MathUtils.lerp(from[2], to[2], u) + (noise(k * 3 + seed + flicker) - 0.5) * 9 * envelope];
  }, width, d.secondary, d.root, 64);
  return bolt;
}

// LIGHTNING: branching sky strikes, nine small shooting bolts, radial chain arcs.
export function buildThunderboltStrike(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 19;
    const flash = d.halo([x, 4, 12], 17, '#ffe96c', d.root, 0.4);
    const bolt = lightning(d, [x - 8, 125 - i * 13, 0], [x, 2, 12], i * 21);
    const branch = lightning(d, [x - 3, 62, 6], [x + 22, 20, 15], i * 37, 0.3);
    d.motions.push(t => { bolt.visible = branch.visible = flash.visible = t > 0.16 + i * 0.14 && Math.sin(t * 31 + i) > -0.55; });
    d.burst(0.2 + i * 0.14, [x, 2, 12], 24, 22, d.primary);
  }
  return d.finish();
}

export function buildChainNova(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8, b = a + TAU / 8;
    const start = polar(a, 38, 15 + i % 3 * 12), end = polar(b, 38, 15 + (i + 1) % 3 * 12);
    const bolt = lightning(d, start, end, i * 12, 0.45);
    const spark = d.star(start, 3, d.white);
    d.motions.push((t, p) => { bolt.visible = t > i * 0.055 && Math.sin(t * 24 + i) > -0.25; spark.scale.setScalar(0.65 + Math.sin(t * 19 + i) * 0.3); bolt.scale.setScalar(0.5 + ease(p * 2) * 0.7); });
  }
  // The snare closes inward and sustains; it deliberately has no attack-style burst.
  d.particles(24, (i, t) => {
    const p = (noise(i) + t * 0.7) % 1;
    return polar(i * 2.399 + Math.floor(t * 12) * 0.08, 36 * (1 - p * 0.35), 5 + noise(i + 4) * 36);
  }, 0.55, d.white);
  return d.finish();
}

// ICE: slender faceted crystals and frost needles, with no opaque freeze sphere.
export function buildGlacialSpikes(spell: ElementalSpell, headingAngle: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, headingAngle);
  for (let i = 0; i < 14; i++) {
    const shard = new THREE.Group(); d.root.add(shard);
    shard.position.set((i % 2 ? -1 : 1) * (4 + noise(i) * 7), 0, 24 + i * 9);
    shard.rotation.z = (noise(i + 8) - 0.5) * 0.65;
    crystal(d, shard, 16 + noise(i) * 24, 2 + noise(i + 1));
    d.motions.push(t => { shard.scale.setScalar(ease((t - i * 0.065) / 0.18)); });
  }
  d.particles(55, (i, t) => [(noise(i) - 0.5) * 32, 4 + (noise(i + 4) * 30 + t * 12) % 30, noise(i + 5) * 135], 0.65, d.white);
  return d.finish();
}

export function buildAbsoluteZero(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6;
    const frostArm = new THREE.Group(); d.root.add(frostArm); frostArm.rotation.y = a;
    d.line([[0, 1, 0], [0, 1, 31]], 0.5, d.secondary, frostArm);
    for (let j = 1; j < 4; j++) d.line([[-5, 1, j * 7 + 5], [0, 1, j * 7], [5, 1, j * 7 + 5]], 0.3, d.white, frostArm);
    const pillar = new THREE.Group(); d.root.add(pillar); crystal(d, pillar, 42, 2.2);
    d.motions.push((t) => {
      const rise = ease((t - 0.18 - i * 0.035) / 0.34);
      const close = ease((t - 0.48) / 0.45);
      const r = 34 - close * 9;
      pillar.position.set(...polar(a, r, 20 * rise));
      pillar.scale.set(0.75 + close * 0.25, rise, 0.75 + close * 0.25);
      pillar.rotation.z = (i % 2 ? -1 : 1) * 0.14;
      frostArm.scale.setScalar(ease(t / 0.38));
    });
  }
  d.particles(34, (i, t) => polar(i * 2.399, 9 + noise(i) * 27, 4 + ((noise(i + 8) * 42 + t * 5) % 42)), 0.55, d.white);
  return d.finish();
}

// WIND: open air strokes with tiny leaf tracers, never a filled funnel.
export function buildTornadoGale(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  const count = 6, height = 92, speed = 4.5;
  const radius = (u: number) => 4 + u * u * 32;
  for (let i = 0; i < count; i++) {
    d.stroke((u, t) => {
      const a = u * TAU * 1.4 + i * TAU / count - t * speed;
      return polar(a, radius(u), u * height);
    }, i % 2 ? 0.35 : 0.7, i % 2 ? d.secondary : d.primary);
  }

  petals(d, 18, (i, t) => { const y = (i * 5 + t * 24) % 92; return polar(i * 2.399 - t * 4.5, 5 + y * y / 240, y); }, 1.1);
  return d.finish();
}

export function buildZephyrBlades(spell: ElementalSpell, headingAngle: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, headingAngle);
  for (let i = 0; i < 4; i++) {
    const blade = d.stroke((u, t) => { const a = (u - 0.5) * Math.PI * 1.3; return [Math.sin(a) * 25, 16 + i * 7 + Math.sin(a) * (i % 2 ? 10 : -10), Math.cos(a) * 16 + clamp((t - i * 0.14) / 1.1) * 175]; }, 0.8, i % 2 ? d.secondary : d.primary);
    d.motions.push(t => { blade.visible = t > i * 0.14 && t < 1.35 + i * 0.08; });
  }
  petals(d, 16, (i, t) => [(noise(i) - 0.5) * 40, 14 + Math.sin(t * 5 + i) * 12, t * 90 - noise(i) * 35], 1);
  return d.finish();
}

// EARTH: fine ground cracks, small flying stones, and a crown of pointed shards.
export function buildBedrockFissure(spell: ElementalSpell, headingAngle: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, headingAngle), rock = d.material('#b89970');
  for (let i = 0; i < 10; i++) {
    const z = i * 12;
    const crack = d.line([[0, 1, z], [i % 2 ? 7 : -6, 1, z + 5], [0, 1, z + 13]], 0.55);
    const shard = new THREE.Group(); d.root.add(shard); shard.position.set(i % 2 ? -8 : 8, 0, z);
    const m = d.mesh(new THREE.OctahedronGeometry(1), rock, shard); m.scale.set(2.6, 10 + noise(i) * 8, 2.8); m.position.y = 8;
    shard.rotation.z = (i % 2 ? 1 : -1) * 0.3;
    d.motions.push(t => { const p = ease((t - i * 0.08) / 0.2); shard.scale.setScalar(p); crack.visible = p > 0; });
  }
  d.particles(45, (i, t) => [(noise(i) - 0.5) * 32, Math.abs(Math.sin(t * 3 + i)) * 14, noise(i + 2) * 125], 0.85, rock);
  return d.finish();
}

export function buildFortressBastion(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), stone = d.material('#ac9074');
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12, h = i % 3 === 0 ? 32 : 18;
    const shard = d.mesh(new THREE.OctahedronGeometry(1), stone);
    d.motions.push(t => { const p = ease((t - i * 0.035) / 0.4); shard.position.set(...polar(a, 27, h * p / 2 + Math.sin(t * 2 + i) * 2)); shard.scale.set(2.4 * p, h * p / 2, 3 * p); shard.rotation.z = Math.cos(a) * -0.25; });
    d.stroke((u, t) => polar(a + u * TAU / 12, 27, 8 + Math.sin(u * Math.PI) * 4 + Math.sin(t * 2) * 2), 0.28, d.secondary);
  }
  d.sparks(35, 33, 42); return d.finish();
}

// NATURE: growing tapered roots, tiny leaves, flowers, and a thorn-petal burst.
export function buildRootEntanglement(spell: ElementalSpell, headingAngle: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, headingAngle);
  for (let i = 0; i < 5; i++) {
    d.stroke((u, t) => { const p = ease(t / 1.15); return [Math.sin(u * 9 + i) * (5 + u * 14), 2 + Math.sin(u * Math.PI * 3) ** 2 * 7, u * 112 * p]; }, 1.1, d.primary);
    for (let j = 0; j < 5; j++) {
      const leaf = d.leaf(1.8, d.secondary);
      d.motions.push(t => { const u = (j + 1) / 6; leaf.position.set(Math.sin(u * 9 + i) * (5 + u * 14), 5, u * 112); leaf.scale.setScalar(ease((t - u) / 0.2)); leaf.rotation.z = i + j; });
    }
  }
  return d.finish();
}

function flower(d: SpellDrawing, position: Point, size: number, material = d.primary) {
  const group = new THREE.Group(); group.position.set(...position); d.root.add(group);
  for (let j = 0; j < 5; j++) {
    const leaf = d.petal(size, material, group); leaf.rotation.z = j * TAU / 5;
  }
  d.mote([0, 0, 0.5], size * 0.65, d.white, group);
  return group;
}

export function buildSporeBloom(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), stem = d.material('#579b65'), pink = d.material('#f7afd3');
  for (let i = 0; i < 7; i++) {
    const a = i * 2.399, h = 22 + noise(i) * 25, x = Math.cos(a) * 24, z = Math.sin(a) * 20;
    d.stroke((u, t) => [x * u, u * h * ease(t / 0.7), z * u + Math.sin(t * 2 + i) * u * 2], 0.7, stem);
    const bloom = flower(d, [x, h, z], 2.4, i % 3 ? d.secondary : pink);
    d.motions.push(t => { bloom.scale.setScalar(ease((t - 0.35) / 0.5)); bloom.rotation.z = Math.sin(t + i) * 0.15; });
  }
  d.sparks(70, 30, 70); return d.finish();
}

// SHADOW: pointed reaching tendrils, winged familiars, and a thin eclipse crescent.
export function buildAbyssalGrasp(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), shade = d.material('#6f378d');
  for (let i = 0; i < 7; i++) {
    const a = i * TAU / 7;
    const path = (u: number, t: number): Point => polar(a + Math.sin(u * 4 + t * 2) * 0.2, 25 - u * u * 20, Math.sin(u * Math.PI * 0.7) * (40 + noise(i) * 20) * ease(t / 0.45));
    d.stroke(path, 1.8, shade);
    d.stroke((u, t) => { const p = path(u, t); p[0] += 0.8; return p; }, 0.3, d.secondary);
  }
  d.sparks(40, 27, 55); return d.finish();
}

export function buildShadowPhantomWave(spell: ElementalSpell, headingAngle: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, headingAngle), shade = d.material('#864bb0');
  for (let i = 0; i < 7; i++) {
    const bat = new THREE.Group(); d.root.add(bat);
    bat.rotation.y = -headingAngle;
    const wings: THREE.Mesh[] = [];
    for (const side of [-1, 1]) {
      const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.quadraticCurveTo(side * 3, 7, side * 10, 3);
      shape.quadraticCurveTo(side * 6, 3, side * 6, -1); shape.quadraticCurveTo(side * 3, 1, 0, -3); shape.closePath();
      wings.push(d.mesh(new THREE.ShapeGeometry(shape), shade, bat));
    }
    d.mote([-1, 0.7, 0.8], 0.4, d.secondary, bat); d.mote([1, 0.7, 0.8], 0.4, d.secondary, bat);
    const pos = (t: number): Point => [(i % 3 - 1) * 18 + Math.sin(t * 4 + i) * 7, 18 + i % 3 * 10 + Math.sin(t * 5 + i) * 4, clamp((t - i * 0.09) / 1.25) * 165];
    const trail = d.stroke((u, t) => pos(t - u * 0.18), 0.45, d.primary);
    d.motions.push(t => { bat.visible = trail.visible = t > i * 0.09; bat.position.set(...pos(t)); wings.forEach((w, j) => { w.rotation.y = Math.sin(t * 16 + i) * (j ? -0.8 : 0.8); }); });
  }
  return d.finish();
}

// LIGHT: fine falling rays, feathered lances, and pointed starbursts.
export function buildSolarDawn(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (let i = 0; i < 11; i++) {
    const x = (i - 5) * 5;
    const ray = d.stroke((u) => [x + u * 9, 5 + u * (80 + noise(i) * 30), Math.sin(i * 2.4) * 17], i % 3 ? 0.28 : 0.7, i % 3 ? d.primary : d.secondary);
    d.motions.push(t => { ray.scale.y = ease((t - noise(i) * 0.3) / 0.4); });
  }
  for (let i = 0; i < 9; i++) { const star = d.star([(noise(i) - 0.5) * 48, 12 + noise(i + 4) * 75, 10], 2.5); d.motions.push(t => { star.scale.setScalar(0.5 + Math.sin(t * 4 + i) * 0.4); }); }
  d.sparks(40, 25, 100); return d.finish();
}

// SPACE: meteor rain, a curved comet volley, and delicate moving orbital paths.
export function buildPlanetaryRings(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  const center = d.star([0, 30, 0], 4, d.white);
  for (let i = 0; i < 4; i++) {
    const path = (u: number, t: number): Point => { const a = u * TAU * 0.82 + t * (0.7 + i * 0.25) + i * 1.5, r = 22 + i * 8; return [Math.cos(a) * r, 30 + Math.sin(a) * r * Math.sin(i * 0.8 + 0.3), Math.sin(a) * r * Math.cos(i * 0.8 + 0.3)]; };
    d.stroke(path, 0.4, i % 2 ? d.primary : d.secondary);
    const planet = d.mote([0, 0, 0], 1.7, d.secondary);
    d.motions.push(t => { planet.position.set(...path(1, t)); center.rotation.z = t; });
  }
  d.sparks(45, 47, 70); return d.finish();
}

// TIME: readable clock hands and ticks, miniature gears, suspended hourglasses.
function clockFace(d: SpellDrawing, position: Point, radius: number, stopAt = Infinity, direction = 1) {
  const clock = new THREE.Group(); clock.position.set(...position); d.root.add(clock);
  d.stroke(u => [Math.cos(u * TAU) * radius, Math.sin(u * TAU) * radius, 0], 0.28, d.primary, clock, 64, false);
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; d.line([[Math.cos(a) * radius * 0.84, Math.sin(a) * radius * 0.84, 0], [Math.cos(a) * radius * 0.96, Math.sin(a) * radius * 0.96, 0]], 0.35, d.secondary, clock); }
  const minute = d.line([[0, 0, 0.3], [0, radius * 0.74, 0.3]], 0.45, d.white, clock);
  const hour = d.line([[0, 0, 0.5], [radius * 0.48, 0, 0.5]], 0.55, d.secondary, clock);
  d.motions.push(t => { const time = Math.min(t, stopAt); minute.rotation.z = direction * time * 3.5; hour.rotation.z = direction * time * 0.8; });
  return clock;
}

export function buildChronoRewind(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell); clockFace(d, [0, 32, 0], 25, Infinity, -1);
  for (let i = 0; i < 3; i++) d.stroke((u, t) => { const a = i * TAU / 3 + u * 1.3 - t * 2; return [Math.cos(a) * 34, 32 + Math.sin(a) * 34, 0]; }, 0.45, d.secondary);
  d.particles(45, (i, t) => { const a = i * 2.399 - t * 1.5, r = 30 + ((noise(i) + t * 0.15) % 1) * 23; return [Math.cos(a) * r, 32 + Math.sin(a) * r * 0.7, Math.sin(i) * 10]; }, 0.6);
  return d.finish();
}

export function buildStasisField(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (let i = 0; i < 6; i++) {
    const group = new THREE.Group(); group.position.set(...polar(i * TAU / 6, 30, 20 + i % 2 * 18)); d.root.add(group);
    d.line([[-3, 6, 0], [3, 6, 0], [-3, -6, 0], [3, -6, 0], [-3, 6, 0]], 0.4, d.secondary, group);
    d.mote([0, -3, 0], 0.8, d.white, group);
    d.motions.push(t => { group.rotation.z = t < 0.6 ? (0.6 - t) * 2 : 0; });
  }
  d.particles(65, (i, t) => { const stopped = Math.min(t, 0.65); return polar(i * 2.399 + stopped, 12 + noise(i) * 31, 8 + noise(i + 3) * 52 + stopped * 9); }, 0.75);
  clockFace(d, [0, 30, -8], 11, 0.65);
  return d.finish();
}

// TECHNOLOGY: discrete laser pulses, hairline circuitry, and tiny guided rockets.
// HEALING: tiny five-petal blossoms, fluttering petals, and individual dew drops.
export function buildSakuraSanctuary(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (let i = 0; i < 7; i++) { const bloom = flower(d, polar(i * 2.399, i ? 25 : 0, 8 + i % 3 * 8), 2.1); d.motions.push(t => { bloom.scale.setScalar(ease((t - i * 0.05) / 0.5)); bloom.rotation.z = Math.sin(t + i) * 0.2; }); }
  petals(d, 30, (i, t) => polar(i * 2.399 + t * 0.65, 12 + noise(i) * 23, (noise(i + 1) * 60 + t * 16) % 60), 1.4);
  d.sparks(45, 34, 68); return d.finish();
}

export function buildVitalityRain(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  for (let i = 0; i < 36; i++) {
    const drop = d.mote([0, 0, 0], 0.8, i % 4 ? d.primary : d.secondary); drop.scale.y = 2.3;
    const x = (noise(i) - 0.5) * 56, z = (noise(i + 8) - 0.5) * 38;
    d.motions.push(t => { const p = (noise(i + 3) + t * 0.6) % 1; drop.position.set(x + Math.sin(t + i) * 2, 76 * (1 - p), z); });
  }
  for (let i = 0; i < 8; i++) { const star = d.star(polar(i * 2.399, 24, 5), 2); d.motions.push(t => { star.scale.setScalar(Math.max(0, Math.sin(t * 4 + i))); }); }
  d.sparks(25, 30, 75); return d.finish();
}

// VOID: a narrow spatial opening, fine rift cuts, and inward/outward fragments.
export function buildSingularityEvent(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell), black = d.material('#110a19');
  const hole = d.mote([0, 30, 0], 8, black); hole.scale.set(0.5, 1.5, 0.3);
  for (let i = 0; i < 5; i++) d.stroke((u, t) => { const a = i * TAU / 5 + u * TAU + t * 2, r = 6 + u * 36; return [Math.cos(a) * r, 30 + Math.sin(a) * r * 0.45, Math.sin(a) * r * 0.5]; }, 0.4, i % 2 ? d.primary : d.secondary);
  d.particles(60, (i, t) => { const p = (noise(i) + t * 0.45) % 1, a = i * 2.399 + t * 3, r = 5 + (1 - p) * 43; return [Math.cos(a) * r, 30 + Math.sin(a) * r * 0.6, Math.sin(i) * r * 0.3]; }, 0.8);
  return d.finish();
}


export { buildPyroclasticSurge, buildWhirlpoolVortex, buildPlasmaRailgun, buildBlizzardVortex, buildAeroShockwave, buildBoulderCatapult, buildIronwoodSlam, buildDarkEclipseNova, buildSunburstLance, buildSupernovaFlare, buildMeteorShower, buildCosmicRay, buildGearBarrage, buildHyperBeam, buildOverclockGrid, buildMissileSalvo, buildPetalBreeze, buildDimensionalSlash, buildVoidCollapse } from './spellDistinctAbilities';
