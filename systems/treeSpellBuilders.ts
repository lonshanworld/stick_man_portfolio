import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, ease, clamp, noise, TAU, type Point } from './spellDrawing';
import { createBarkMaterial, createLeafMaterial, createTreeBranch, createTreeLeafGeometry, createLeafCluster } from './treeNature';

function forest(spell: ElementalSpell, heading = 0) {
  const d = new SpellDrawing(spell, heading);
  const bark = createBarkMaterial('#795336'), leaf = createLeafMaterial('#5C9E3E'), sunLeaf = createLeafMaterial('#86B64B');
  d.surfaces.push(bark, leaf, sunLeaf); return { d, bark, leaf, sunLeaf };
}

function branch(d: SpellDrawing, path: (u: number) => Point, radius: number, material: THREE.ShaderMaterial, delay: number, growSeconds: number, parent: THREE.Object3D = d.root) {
  const wood = createTreeBranch(path, radius, material); parent.add(wood.root);
  d.motions.push(t => wood.update(ease((t - delay) / growSeconds))); return wood.root;
}

function leaf(d: SpellDrawing, position: Point, size: number, material: THREE.ShaderMaterial, delay: number, rotation = 0, parent: THREE.Object3D = d.root) {
  const mesh = new THREE.Mesh(createTreeLeafGeometry(size), material); mesh.name = 'tree-unfurling-leaf'; parent.add(mesh); mesh.position.set(...position);
  mesh.rotation.set(.35, rotation, rotation * .45);
  d.motions.push(t => { const growth = ease((t - delay) / .3); mesh.visible = growth > .002; mesh.scale.setScalar(growth); mesh.rotation.z = rotation * .45 + Math.sin(t * 1.8 + position[0]) * .12; }); return mesh;
}

function canopy(d: SpellDrawing, position: Point, radius: number, size: number, material: THREE.ShaderMaterial, delay: number, parent: THREE.Object3D = d.root, count = 20) {
  const pivot = new THREE.Group(); pivot.position.set(...position); parent.add(pivot);
  const leaves = createLeafCluster([0, 0, 0], radius, size, material, count, position[0]); pivot.add(leaves);
  d.motions.push(t => { const growth = ease((t - delay) / .35); pivot.visible = growth > .002; pivot.scale.setScalar(growth); pivot.rotation.z = Math.sin(t * 1.4 + position[0]) * .035; });
  return leaves;
}

function fallingLeaves(d: SpellDrawing, center: Point, spread: number, at: number, material: THREE.ShaderMaterial, count = 14) {
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(createTreeLeafGeometry(2.5 + noise(i)), material); mesh.name = 'tree-falling-leaf'; d.root.add(mesh);
    d.motions.push(t => {
      const age = t - at - noise(i) * .4;
      mesh.visible = age > 0;
      mesh.position.set(center[0] + (noise(i + 1) - .5) * spread + Math.sin(age * 3 + i) * age * 3, Math.max(1, center[1] - age * 15), center[2] + (noise(i + 4) - .5) * spread);
      mesh.rotation.set(age * 1.7 + i, age * 2 + i, Math.sin(age * 2 + i) * .6);
    });
  }
}

export function buildRootEntanglement(spell: ElementalSpell, heading: number, distance = 125) {
  const { d, bark, leaf: foliage, sunLeaf } = forest(spell, heading);
  d.root.userData.treeDesign = 'branching-root-grasp';
  const reach = Math.max(45, distance);
  for (let i = 0; i < 5; i++) {
    const path = (u: number): Point => [Math.sin(u * 7 + i) * u * 10 + (i - 2) * u * 6, 1.2 + Math.sin(u * 9 + i) ** 2 * 2.6, u * reach];
    const root = branch(d, path, 2.8 + noise(i) * 1.3, bark, i * .025, .78); root.name = 'tree-traveling-root';
    for (let j = 0; j < 2; j++) {
      const u = .3 + j * .32, start = path(u), side = (i + j) % 2 ? 1 : -1;
      branch(d, v => [start[0] + side * v * 16, start[1] + Math.sin(v * Math.PI) * 4, start[2] + v * 10], 1.4, bark, u * .78, .3);
      leaf(d, [start[0] + side * 14, 4, start[2] + 8], 6, j ? sunLeaf : foliage, u * .78 + .2, side * 1.2);
    }
  }
  for (let i = 0; i < 8; i++) {
    const angle = i * TAU / 8;
    const grip = branch(d, u => {
      const a = angle + u * .7, r = 22 - u * 14;
      return [Math.cos(a) * r, 1 + Math.sin(u * Math.PI * .65) * 30, reach + Math.sin(a) * r];
    }, 2.6, bark, .67 + i * .025, .42); grip.name = 'tree-root-grip';
    leaf(d, [Math.cos(angle + .65) * 9, 28, reach + Math.sin(angle + .65) * 9], 5, foliage, .95 + i * .025, angle);
  }
  fallingLeaves(d, [0, 27, reach], 34, 1.2, foliage, 10);
  return d.finish();
}

export function buildSporeBloom(spell: ElementalSpell) {
  const { d, bark, leaf: foliage, sunLeaf } = forest(spell); d.root.userData.treeDesign = 'restorative-sapling-grove';
  for (let i = 0; i < 3; i++) {
    const tree = new THREE.Group(); tree.name = 'tree-healing-sapling'; tree.position.set(i === 0 ? -28 : i === 1 ? 29 : 0, 0, i === 2 ? -27 : 4); d.root.add(tree);
    const height = [44, 37, 30][i], delay = i * .08;
    branch(d, u => [Math.sin(u * 2.8 + i) * u * 3, u * height, Math.sin(u * 4) * 2], 4, bark, delay, .55, tree);
    for (let j = 0; j < 4; j++) {
      const a = j * TAU / 4 + i;
      branch(d, u => [Math.cos(a) * u * 15, 2 * (1 - u), Math.sin(a) * u * 15], 2.4, bark, delay, .35, tree);
    }
    for (let j = 0; j < 3; j++) {
      const angle = j * TAU / 3 + i, tip: Point = [Math.cos(angle) * 13, height * (.72 + j * .065), Math.sin(angle) * 12];
      branch(d, u => [tip[0] * u, height * .48 + u * (tip[1] - height * .48), tip[2] * u], 1.9, bark, .25 + delay, .42, tree);
      canopy(d, tip, 10, 10, j % 2 ? sunLeaf : foliage, .55 + delay + j * .05, tree, 18);
    }
  }
  // Amber sap/pollen drifts from the grove toward the caster's heartwood.
  const pollen = d.material('#D1D783', .75);
  for (let i = 0; i < 24; i++) {
    const mote = d.mesh(new THREE.SphereGeometry(.6 + noise(i) * .5, 6, 4), pollen); mote.name = 'tree-restorative-pollen';
    d.motions.push(t => {
      const age = t - .65 - noise(i) * .35, p = clamp(age / 1.1), side = i % 2 ? 1 : -1;
      mote.visible = age > 0 && age < 1.3;
      mote.position.set(side * (1 - p) * 29 + Math.sin(p * 6 + i) * 3, 41 - p * 24 + Math.sin(p * Math.PI) * 4, 5 + Math.cos(i) * (1 - p) * 12);
      mote.scale.setScalar(Math.sin(p * Math.PI));
    });
  }
  fallingLeaves(d, [0, 40, 0], 65, 1, foliage, 12);
  return d.finish();
}

export function buildIronwoodSlam(spell: ElementalSpell) {
  const { d, bark, leaf: foliage, sunLeaf } = forest(spell); d.root.userData.treeDesign = 'rooted-timber-canopy';
  for (const side of [-1, 1]) {
    const path = (u: number): Point => [side * (27 - u * u * 21), u * 57, -8 + Math.sin(u * Math.PI) * 7];
    const trunk = branch(d, path, 6.5, bark, 0, .75); trunk.name = 'tree-guardian-trunk';
    for (let j = 0; j < 4; j++) {
      const a = j * TAU / 4;
      branch(d, u => [side * 27 + Math.cos(a) * u * 15, 2.2 * (1 - u), -8 + Math.sin(a) * u * 17], 3.1, bark, .03, .4);
    }
    for (let j = 0; j < 4; j++) {
      const u = .45 + j * .14, start = path(u), tip: Point = [start[0] + side * (18 - j * 2), start[1] + 10, start[2] + (j % 2 ? -14 : 13)];
      branch(d, v => [start[0] + (tip[0] - start[0]) * v, start[1] + (tip[1] - start[1]) * v + Math.sin(v * Math.PI) * 3, start[2] + (tip[2] - start[2]) * v], 2.6, bark, .35 + j * .06, .45);
      canopy(d, tip, 11, 11, j % 2 ? sunLeaf : foliage, .7 + j * .045, d.root, 18);
    }
  }
  // Intertwined living boughs close the wooden vault between the rooted trunks.
  for (const side of [-1, 1]) branch(d, u => [side * (18 - u * 28), 46 + Math.sin(u * Math.PI) * 8, -5 + side * Math.sin(u * Math.PI) * 3], 3.5, bark, .5, .45);
  canopy(d, [0, 56, -5], 13, 12, sunLeaf, .8, d.root, 26);
  fallingLeaves(d, [0, 53, -4], 67, 1.3, foliage, 18);
  return d.finish();
}
