import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { buildRootEntanglement, buildSporeBloom, buildIronwoodSlam } from '../systems/treeSpellBuilders';
import { createTreeBranch, createTreeLeafGeometry, createBarkMaterial, createTreeCrest } from '../systems/treeNature';
import { treeCastPose } from '../systems/treeCastPose';
import { createHandMagicSeal, updateHandMagicSeal } from '../systems/magicSeal3D';

test('woody roots advance to their target before growing a vertical grip', () => {
  const spell = ELEMENTAL_SPELLS.trees[0], effect = buildRootEntanglement(spell, 0, 150);
  const roots = effect.root.children.filter(node => node.name === 'tree-traveling-root') as THREE.Mesh[];
  const grip = effect.root.children.filter(node => node.name === 'tree-root-grip') as THREE.Mesh[];
  expect(roots).toHaveLength(5); expect(grip).toHaveLength(8);
  effect.update(0, .25, spell.duration);
  const positions = roots[0].geometry.getAttribute('position');
  const extent = Math.max(...Array.from({ length: positions.count }, (_, i) => positions.getZ(i)));
  expect(extent).toBeGreaterThan(10); expect(extent).toBeLessThan(80);
  expect(grip.every(node => !node.visible)).toBe(true);
  effect.update(0, 1.4, spell.duration);
  expect(grip.every(node => node.visible)).toBe(true);
  for (const node of grip) {
    const p = node.geometry.getAttribute('position');
    expect(Math.max(...Array.from({ length: p.count }, (_, i) => p.getY(i)))).toBeGreaterThan(25);
    expect(Math.min(...Array.from({ length: p.count }, (_, i) => p.getZ(i)))).toBeGreaterThan(120);
  }
});

test('the restoring grove grows three branching saplings and draws pollen toward its caster', () => {
  const spell = ELEMENTAL_SPELLS.trees[1], effect = buildSporeBloom(spell);
  const saplings = effect.root.children.filter(node => node.name === 'tree-healing-sapling');
  expect(saplings).toHaveLength(3);
  const canopies: THREE.InstancedMesh[] = [];
  effect.root.traverse(node => { if (node instanceof THREE.InstancedMesh) canopies.push(node); });
  expect(canopies).toHaveLength(9);
  expect(canopies.reduce((count, node) => count + node.count, 0)).toBeGreaterThan(150);
  const pollen = effect.root.getObjectByName('tree-restorative-pollen')!;
  effect.update(0, .8, spell.duration); const start = Math.abs(pollen.position.x), height = pollen.position.y;
  effect.update(0, 1.6, spell.duration);
  expect(Math.abs(pollen.position.x)).toBeLessThan(start);
  expect(pollen.position.y).toBeLessThan(height);
  effect.update(0, 1.95, spell.duration);
  expect(pollen.position.y).toBeLessThan(25);
});

test('the guardian raises two rooted trunks and branches before its leaf canopy unfolds', () => {
  const spell = ELEMENTAL_SPELLS.trees[2], effect = buildIronwoodSlam(spell);
  const trunks = effect.root.children.filter(node => node.name === 'tree-guardian-trunk');
  expect(trunks).toHaveLength(2);
  const canopies: THREE.InstancedMesh[] = [];
  effect.root.traverse(node => { if (node instanceof THREE.InstancedMesh) canopies.push(node); });
  effect.update(0, .3, spell.duration);
  expect(canopies.every(node => !node.parent!.visible && node.parent!.scale.x === 0)).toBe(true);
  effect.update(0, 1.4, spell.duration);
  expect(canopies.every(node => node.parent!.visible && node.parent!.scale.x === 1)).toBe(true);
  expect(canopies.reduce((count, node) => count + node.count, 0)).toBeGreaterThan(150);
});

test('branch growth tapers natural wood and reuses the original vertex buffers', () => {
  const wood = createTreeBranch(u => [u * 3, u * 30, 0], 4, createBarkMaterial());
  const positions = wood.root.geometry.getAttribute('position');
  const last = positions.count - 1;
  const baseWidth = Math.hypot(positions.getX(0), positions.getZ(0));
  const tipWidth = Math.hypot(positions.getX(last) - 3, positions.getZ(last));
  expect(baseWidth).toBeGreaterThan(tipWidth * 8);
  wood.update(.3); wood.update(.8);
  expect(wood.root.geometry.getAttribute('position')).toBe(positions);
  const leaf = createTreeLeafGeometry();
  expect(leaf.getAttribute('normal')).toBeDefined();
  expect(Array.from(leaf.getAttribute('position').array).some((value, i) => i % 3 === 2 && value > .1)).toBe(true);
});

test('all three tree spells remain finite, deterministic, and fully fade at the end', () => {
  const builders = [buildRootEntanglement, buildSporeBloom, buildIronwoodSlam];
  for (const [index, spell] of ELEMENTAL_SPELLS.trees.entries()) {
    const effect = builders[index](spell, Math.PI / 2);
    const meshes: THREE.Mesh[] = [];
    effect.root.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
    const geometries = meshes.map(node => node.geometry);
    for (const progress of [0, .18, .5, .7, .9, 1]) {
      effect.update(.016, spell.duration * progress, spell.duration);
      expect(meshes.map(node => node.geometry)).toEqual(geometries);
      for (const mesh of meshes) {
        expect(mesh.position.toArray().every(Number.isFinite)).toBe(true);
        expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);
        const material = mesh.material as THREE.ShaderMaterial | THREE.MeshBasicMaterial;
        if (progress === 1) expect(material instanceof THREE.ShaderMaterial ? material.uniforms.uOpacity.value : material.opacity).toBe(0);
      }
    }
    effect.update(0, spell.duration * .5, spell.duration);
    const snapshot = meshes.map(node => node.position.toArray());
    effect.update(.5, spell.duration * .5, spell.duration);
    expect(meshes.map(node => node.position.toArray())).toEqual(snapshot);
  }
});

test('Groot sprouts a swaying branch crown and a compact shoot in his palm', () => {
  const crown = createTreeCrest(); crown.update(.2);
  const leaf = crown.root.children.find(node => node instanceof THREE.Mesh && node.name !== 'tree-wood-branch')!;
  const rotation = leaf.rotation.z; crown.update(1.4);
  expect(leaf.rotation.z).not.toBe(rotation);
  expect(crown.root.rotation.y).toBe(0);
  const palm = new THREE.Group(), torso = new THREE.Group(); torso.position.y = .5;
  const seal = createHandMagicSeal('trees', '#6E442B', '#65B842', torso); palm.add(seal);
  expect(seal.children).toHaveLength(8);
  updateHandMagicSeal(seal, true, .5, 1);
  expect(seal.visible).toBe(true);
  expect(seal.quaternion.toArray().every(Number.isFinite)).toBe(true);
  expect(new THREE.Box3().setFromObject(seal).getSize(new THREE.Vector3()).length()).toBeLessThan(.7);
  updateHandMagicSeal(seal, false, 2, 1); expect(seal.visible).toBe(false);
});

test('root sowing, grove nurturing, and canopy raising have distinct grounded gestures', () => {
  const poses = ELEMENTAL_SPELLS.trees.map(spell => treeCastPose(spell.id, .4));
  expect(new Set(poses.map(pose => JSON.stringify(pose))).size).toBe(3);
  expect(poses.every(pose => pose.bodyY >= .45 && pose.bodyY <= .55)).toBe(true);
  for (const spell of ELEMENTAL_SPELLS.trees) expect(treeCastPose(spell.id, 1).bodyY).toBe(.55);
});
