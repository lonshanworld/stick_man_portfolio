import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, clamp, ease, noise, TAU, type Point, type BuiltSpellEffect } from './spellDrawing';
import { createElectricArc, type ElectricPoint } from './electricArc';

type Endpoint = ElectricPoint | ((time: number) => ElectricPoint);
function arc(d: SpellDrawing, from: Endpoint, to: Endpoint, width: number, seed: number, jitter = 8,
  gold = false, parent: THREE.Object3D = d.root) {
  const discharge = createElectricArc(from, to, width, seed, jitter, 18, gold);
  parent.add(discharge.root); d.surfaces.push(discharge.material); d.motions.push(discharge.update);
  return discharge;
}

export function buildThunderboltStrike(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell); d.root.userData.lightningDesign = 'forked-sky-restrikes';
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 24, at = .16 + i * .14, target: Point = [x, 2, 14];
    const strike = new THREE.Group(); d.root.add(strike);
    const main = arc(d, [x - 10, 114 - i * 7, -8], target, 6.2, i * 71, 15, i === 1, strike);
    for (let j = 0; j < 4; j++) {
      const junction = .24 + j * .16;
      arc(d, t => main.pointAt(junction, t), t => { const p = main.pointAt(junction, t);
        return [p[0] + (j % 2 ? -1 : 1) * (14 + j * 4), p[1] - 17 - j * 2, p[2] + (j % 2 ? 8 : -8)];
      }, 2.4, i * 53 + j * 19 + 400, 6, false, strike);
    }
    const ground = new THREE.Group(); ground.position.set(...target); d.root.add(ground);
    for (let j = 0; j < 6; j++) {
      const a = j * TAU / 6;
      arc(d, [0, 0, 0], [Math.cos(a) * 23, .8, Math.sin(a) * 23], 1.9, i * 40 + j, 7, true, ground);
    }
    const flash = d.halo(target, 24, '#a5d5ff', d.root, .45);
    d.burst(at, target, 26, 22, d.white);
    d.motions.push(t => {
      const age = t - at, strength = age % .33 < .075 ? 1 : .48;
      strike.visible = t >= at; ground.visible = t > at - .1;
      strike.traverse(node => { if (node instanceof THREE.Mesh && node.material instanceof THREE.ShaderMaterial) node.material.uniforms.uStrength.value = strength; });
      flash.visible = t > at; flash.material.opacity *= strength;
      ground.scale.setScalar(.35 + ease(Math.max(0, age) / .3) * .65);
    });
  }
  return d.finish();
}

export function buildPlasmaRailgun(spell: ElementalSpell, heading: number): BuiltSpellEffect {
  const d = new SpellDrawing(spell, heading); d.root.userData.lightningDesign = 'sparkbolt-lances';
  for (let i = 0; i < 9; i++) {
    const delay = .04 + i * .055, flight = .6;
    const position = (t: number): Point => { const p = clamp((t - delay) / flight);
      return [(i % 3 - 1) * (5 + p * 20), 24 + (i % 2) * 6, 12 + p * 205];
    };
    const bolt = arc(d, position, t => position(t - .13), 3, i * 17 + 100, 5, i % 3 === 0);
    const fork = arc(d, t => bolt.pointAt(.45, t), t => {
      const p = position(t - .15); return [p[0] + (i % 2 ? -9 : 9), p[1] + 4, p[2]];
    }, 1.3, i * 31 + 800, 4);
    const spark = d.star([0, 0, 0], 1.5, d.white);
    const glow = d.halo([0, 0, 0], 8, '#94c8ff', spark, .25);
    d.motions.push(t => { const active = t > delay && t < delay + flight;
      bolt.root.visible = fork.root.visible = spark.visible = active;
      spark.position.set(...position(t)); spark.rotation.z = t * 8 + i; glow.material.opacity *= .65 + .35 * Math.sin(t * 40 + i);
    });
    d.burst(delay + flight, position(delay + flight), 12, 8, d.white);
  }
  return d.finish();
}

export function buildChainNova(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell); d.root.userData.lightningDesign = 'conductive-arc-cage';
  const trap = new THREE.Group(); d.root.add(trap);
  const nodes: Point[] = Array.from({ length: 6 }, (_, i) => [Math.cos(i * TAU / 6) * 35, 18 + (i % 2) * 9, Math.sin(i * TAU / 6) * 35]);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i], next = nodes[(i + 1) % nodes.length];
    const terminal = d.mesh(new THREE.BoxGeometry(2.4, 7, 2.4), d.material('#253e59'), trap);
    terminal.position.set(node[0], 3.5, node[2]);
    const glow = d.star(node, 2.2, d.white, trap);
    d.halo(node, 9, '#80baff', trap, .18);
    arc(d, [node[0], 5, node[2]], node, 1.8, i * 31, 6, true, trap);
    arc(d, node, next, 2.6, i * 53 + 200, 10, false, trap);
    const spoke = arc(d, node, [0, 17, 0], 1.8, i * 71 + 500, 9, i % 2 === 0, trap);
    arc(d, t => spoke.pointAt(.55, t), [next[0] * .35, 7, next[2] * .35], 1.05, i * 83 + 900, 5, false, trap);
    d.motions.push(t => { glow.scale.setScalar(.65 + .35 * noise(Math.floor(t * 20) + i)); });
  }
  d.motions.push(t => { trap.scale.setScalar(.35 + ease(t / .3) * .65);
    const strength = .45 + .55 * Math.pow(.5 + .5 * Math.sin(t * 23), 2);
    trap.traverse(node => { if (node instanceof THREE.Mesh && node.material instanceof THREE.ShaderMaterial) node.material.uniforms.uStrength.value = strength; });
  });
  return d.finish();
}
