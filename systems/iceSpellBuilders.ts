import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, ease, noise, polar, TAU, type Point } from './spellDrawing';
import { createIceMaterial, iceCrystalGeometry } from './iceCrystal';

function crystal(d: SpellDrawing, radius: number, height: number, parent: THREE.Object3D = d.root) {
  const material = createIceMaterial(); d.surfaces.push(material);
  const mesh = new THREE.Mesh(iceCrystalGeometry(radius, height), material); parent.add(mesh); return mesh;
}
function frost(d: SpellDrawing, parent: THREE.Object3D, size: number, vertical = false) {
  const white = d.material('#e4f2ff', .72);
  for (let i = 0; i < 6; i++) {
    const arm = new THREE.Group(); parent.add(arm);
    if (vertical) arm.rotation.z = i * TAU / 6; else arm.rotation.y = i * TAU / 6;
    const p = (x: number, y: number): Point => vertical ? [x, y, .2] : [x, .3, y];
    d.line([p(0, 0), p(0, size)], .3, white, arm);
    for (let j = 1; j < 4; j++) for (const side of [-1, 1]) d.line([p(0, size * j / 4), p(side * size * .16, size * (j / 4 + .16))], .18, white, arm);
  }
}
function shavings(d: SpellDrawing, radius: number, height: number, length = radius * 2) {
  const snow = d.material('#eff8ff', .7);
  const flakes = new THREE.InstancedMesh(iceCrystalGeometry(.35, 1.2), snow, 38);
  flakes.frustumCulled = false; d.root.add(flakes);
  const transform = new THREE.Object3D();
  d.motions.push(t => {
    for (let i = 0; i < 38; i++) {
      transform.position.set((noise(i) - .5) * radius * 2 + Math.sin(t * .5 + i) * 2,
        (height + noise(i + 6) * height - t * (8 + noise(i + 2) * 6)) % height,
        (noise(i + 9) - .5) * length);
      transform.rotation.set(i + t * .3, i * 2.399, i + t * .2);
      transform.scale.setScalar(.45 + noise(i + 3) * .65); transform.updateMatrix();
      flakes.setMatrixAt(i, transform.matrix);
    }
    flakes.instanceMatrix.needsUpdate = true;
  });
}

export function buildGlacialSpikes(spell: ElementalSpell, heading: number) {
  const d = new SpellDrawing(spell, heading); d.root.userData.iceDesign = 'erupting-glacial-clusters';
  for (let i = 0; i < 9; i++) {
    const cluster = new THREE.Group(); cluster.position.set((i % 2 ? -1 : 1) * 6, 0, 22 + i * 14); d.root.add(cluster);
    crystal(d, 4.5 + noise(i) * 2, 25 + noise(i + 8) * 24, cluster);
    for (const side of [-1, 1]) { const shard = crystal(d, 2.6, 15 + noise(i + side + 30) * 10, cluster); shard.position.x = side * 4; shard.rotation.z = -side * .4; }
    const frostRoot = new THREE.Group(); cluster.add(frostRoot); frost(d, frostRoot, 11);
    d.motions.push((t, p) => { const rise = ease((t - i * .075) / .22), thaw = ease((p - .76) / .24); cluster.scale.set(rise, rise * (1 - thaw * .75), rise); cluster.position.y = -2 * (1 - rise); cluster.rotation.z = thaw * (i % 2 ? .22 : -.22); });
  }
  const trail = d.line([[0,.2,8],[5,.2,35],[-4,.2,63],[4,.2,92],[0,.2,145]], .7, d.material('#adcde9', .55));
  d.motions.push(t => { trail.scale.z = ease(t / .8); }); shavings(d, 19, 44, 145);
  return d.finish();
}

export function buildBlizzardVortex(spell: ElementalSpell) {
  const d = new SpellDrawing(spell); d.root.userData.iceDesign = 'hexagonal-frost-mirror';
  const shield = new THREE.Group(); shield.position.set(0, 50, 31); d.root.add(shield);
  const material = createIceMaterial(.83); d.surfaces.push(material);
  const shape = new THREE.Shape();
  for (let j = 0; j < 6; j++) { const a = j * TAU / 6 + Math.PI / 6; const x = Math.cos(a) * 12, y = Math.sin(a) * 12; if (j) shape.lineTo(x,y); else shape.moveTo(x,y); } shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: true, bevelSize: .8, bevelThickness: .8, bevelSegments: 1, steps: 1 });
  for (let i = 0; i < 7; i++) {
    const pane = new THREE.Group(); shield.add(pane); pane.add(new THREE.Mesh(geometry, material));
    const a = (i - 1) * TAU / 6, x = i ? Math.cos(a) * 22 : 0, y = i ? Math.sin(a) * 22 : 0;
    const edge: Point[] = Array.from({length:7}, (_,j) => [Math.cos(j * TAU / 6 + Math.PI / 6) * 12, Math.sin(j * TAU / 6 + Math.PI / 6) * 12, 4]);
    d.line(edge, .32, d.material('#e4f2ff', .65), pane);
    const etching = d.material('#e1efff', .38);
    d.line([[-8, 5, 4.1], [-4, 2, 4.1], [-5, -2, 4.1], [-2, -5, 4.1]], .14, etching, pane);
    d.line([[-4, 2, 4.1], [-1, 3, 4.1], [2, 1, 4.1]], .1, etching, pane);
    d.line([[8, -4, 4.1], [5, -2, 4.1], [6, 2, 4.1]], .13, etching, pane);
    if (!i) { const mark = new THREE.Group(); mark.position.z = 4; pane.add(mark); frost(d,mark,9,true); }
    d.motions.push((t, phase) => { const p = ease((t - i * .045) / .4), thaw = ease((phase - .76) / .24); pane.position.set(x * (1.8 - .8 * p + thaw * .5), y * (1.8 - .8 * p) - thaw * 16, (1-p + thaw * .4) * (i % 2 ? 20 : -20)); pane.scale.setScalar(p * (1 - thaw * .4)); pane.rotation.y = (1-p + thaw) * (i % 2 ? .8 : -.8); });
  }
  shavings(d, 33, 65); return d.finish();
}

export function buildAbsoluteZero(spell: ElementalSpell) {
  const d = new SpellDrawing(spell); d.root.userData.iceDesign = 'sixfold-freezing-prison';
  const ground = new THREE.Group(); d.root.add(ground); frost(d, ground, 37);
  d.motions.push(t => { ground.scale.setScalar(ease(t / .4)); });
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6, pillar = new THREE.Group(); d.root.add(pillar);
    crystal(d, 5.3, 53 + (i % 2) * 8, pillar);
    const wing = crystal(d, 3.5, 31, pillar); wing.position.x = 5; wing.rotation.z = .35;
    pillar.rotation.y = -a;
    d.motions.push((t, p) => { const grow = ease((t - .2 - i * .025) / .35), close = ease((t - .5) / .35), thaw = ease((p - .78) / .22); pillar.position.set(...polar(a, 34-close*6 + thaw*8,0)); pillar.scale.set(1,grow * (1-thaw*.7),1); pillar.rotation.z = close * .2 - thaw * .3; });
  }
  shavings(d, 37, 62); return d.finish();
}
