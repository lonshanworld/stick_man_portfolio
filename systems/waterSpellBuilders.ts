import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, ease, noise, TAU, type Point, type BuiltSpellEffect } from './spellDrawing';
import { createWaterMaterial, type WaterSurfaceKind } from './waterMaterials';

function water(d: SpellDrawing, kind: WaterSurfaceKind, amplitude = .3) {
  const material = createWaterMaterial(kind, amplitude); d.surfaces.push(material); return material;
}

function pipe(parent: THREE.Object3D, path: (u: number) => Point, radius: number, material: THREE.Material) {
  const points = Array.from({ length: 49 }, (_, i) => new THREE.Vector3(...path(i / 48)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, radius, 8, false), material);
  parent.add(mesh); return mesh;
}

function drops(d: SpellDrawing, parent: THREE.Object3D, count: number, path: (i: number, time: number) => Point,
  size = .8, foam = false) {
  const material = foam ? d.material('#d9f5ed', .8) : water(d, 'drop', .025);
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; parent.add(mesh);
  const dummy = new THREE.Object3D();
  d.motions.push(t => {
    for (let i = 0; i < count; i++) {
      dummy.position.set(...path(i, t)); const radius = size * (.4 + noise(i) * .6);
      dummy.scale.set(radius, radius * (foam ? .7 : 1.4), radius); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return mesh;
}

export function buildTidalSurge(spell: ElementalSpell, heading: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading); d.root.userData.waterDesign = 'breaking-tidal-crest';
  const crest = new THREE.Group(); d.root.add(crest);
  const geometry = new THREE.PlaneGeometry(1, 1, 48, 40), positions = geometry.attributes.position;
  const curl = (x: number, u: number, time: number): Point => {
    const a = u * Math.PI * (1.45 + Math.sin(x * .18 - time * 2) * .055), height = 22 * (1 - .15 * Math.pow(x / 38, 2));
    return [x, 2 + (1 - Math.cos(a)) * height + Math.sin(x * .16 + time * 3) * u * 1.4,
      Math.sin(a) * 21 + Math.cos(x * .11) * 3];
  };
  d.motions.push(t => {
    for (let i = 0; i < positions.count; i++) {
      const uv = geometry.attributes.uv; positions.setXYZ(i, ...curl((uv.getX(i) - .5) * 76, uv.getY(i), t));
    }
    positions.needsUpdate = true; geometry.computeVertexNormals();
  });
  const sheet = new THREE.Mesh(geometry, water(d, 'crest', .55)); sheet.frustumCulled = false; crest.add(sheet);
  // Foam clings to the curling lip while spray peels away and falls behind it.
  drops(d, crest, 90, (i, t) => {
    const x = (noise(i) - .5) * 74, u = .74 + noise(i + 5) * .24;
    const p = curl(x, u, t); p[1] += Math.sin(t * 8 + i) * .5; return p;
  }, 1, true);
  drops(d, crest, 70, (i, t) => {
    const age = (t * .75 + noise(i)) % 1, p = curl((noise(i + 3) - .5) * 75, .78, t);
    return [p[0] + (noise(i + 6) - .5) * age * 16, p[1] + age * 10 - age * age * 38, p[2] + age * 33];
  }, .8);
  const wake = new THREE.Mesh(new THREE.CircleGeometry(1, 64), water(d, 'pool', .12));
  wake.rotation.x = -Math.PI / 2; wake.scale.set(38, 27, 1); wake.position.set(0, 1, -9); crest.add(wake);
  d.motions.push(t => { const rise = ease(t / .32); crest.position.z = 18 + t * 63;
    crest.scale.set(rise, rise * (1 - ease((t - 1.42) / .58) * .45), 1); });
  return d.finish();
}

export function buildWhirlpoolVortex(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell); d.root.userData.waterDesign = 'circulating-tideguard';
  const guard = new THREE.Group(); guard.position.set(0, 34, 25); d.root.add(guard);
  const material = water(d, 'shield', .014);
  const membrane = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32, 0, Math.PI), material);
  membrane.scale.set(27, 32, 11); guard.add(membrane);
  const flow = water(d, 'flow', .18);
  pipe(guard, u => { const a = u * TAU; return [Math.cos(a) * 27, Math.sin(a) * 32, 0]; }, 1.15, flow);
  // A single inward current runs over the membrane instead of rigid horizontal ribs.
  pipe(guard, u => { const a = u * TAU * 2.15, r = .15 + u * .81;
    return [Math.cos(a) * 27 * r, Math.sin(a) * 32 * r, Math.sqrt(1 - r * r) * 11 + .3];
  }, .8, flow);
  drops(d, guard, 24, (i, t) => { const a = i / 24 * TAU + t * 1.8;
    return [Math.cos(a) * 27, Math.sin(a) * 32, Math.sin(a * 3 - t) * 1.2];
  }, .8);
  d.halo([0, 0, -2], 35, '#38b6b7', guard, .13);
  d.motions.push(t => { const growth = ease(t / .4); guard.scale.set(growth * (1 + Math.sin(t * 3) * .015), growth, growth);
    guard.rotation.y = Math.sin(t * 2) * .08; });
  return d.finish();
}

export function buildOceanicGeyser(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell); d.root.userData.waterDesign = 'restorative-rain-spring';
  const spring = new THREE.Group(); d.root.add(spring);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(32, 72), water(d, 'pool', .2));
  pool.rotation.x = -Math.PI / 2; pool.position.y = .8; spring.add(pool);
  const flow = water(d, 'flow', .4);
  pipe(spring, u => [Math.sin(u * 4) * 2, 1 + u * 43, Math.cos(u * 5) * 2], 3.2, flow);
  for (let i = 0; i < 7; i++) {
    const a = i * TAU / 7;
    pipe(spring, u => { const r = u * 28;
      return [Math.cos(a) * r, 42 * (1 - u) + Math.sin(u * Math.PI) * 24, Math.sin(a) * r];
    }, 1.25, flow);
  }
  drops(d, spring, 90, (i, t) => { const age = (noise(i) + t * .65) % 1, a = i * 2.399;
    const radius = 8 + noise(i + 2) * 21;
    return [Math.cos(a) * radius, 46 * (1 - age * age), Math.sin(a) * radius];
  }, .9);
  drops(d, spring, 36, (i, t) => { const a = i * 2.399 + t * .3, radius = 20 + noise(i) * 10;
    return [Math.cos(a) * radius, 1.2 + Math.sin(t * 3 + i) * .3, Math.sin(a) * radius];
  }, .65, true);
  d.halo([0, 5, 0], 30, '#5cd9c7', spring, .16);
  d.motions.push(t => { const grow = ease(t / .4), settle = 1 - ease((t - 1.35) / .65);
    spring.scale.set(grow, grow * (.2 + settle * .8), grow); });
  return d.finish();
}
