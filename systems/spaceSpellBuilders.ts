import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, TAU, ease, noise, type Point } from './spellDrawing';
import { createCosmicLens, createCosmicMaterial, createSpaceWard } from './spaceCosmos';

function lens(d: SpellDrawing, kind: 'blackhole' | 'wormhole' | 'planet', radius: number, parent = d.root) {
  const effect = createCosmicLens(kind, radius);
  parent.add(effect.root); d.surfaces.push(effect.material); return effect.root;
}

/** Matter visibly spirals inward, stretches, then disappears into an opaque event horizon. */
export function buildMeteorShower(spell: ElementalSpell) {
  const d = new SpellDrawing(spell);
  const hole = lens(d, 'blackhole', 48); hole.position.y = 30;
  hole.name = 'gravity-well-event-horizon';
  const metric = createCosmicMaterial('metric', .55); d.surfaces.push(metric);
  const fabric = new THREE.Mesh(new THREE.PlaneGeometry(130, 100, 28, 22), metric);
  d.root.add(fabric); fabric.name = 'gravity-well-curved-spacetime';
  const positions = fabric.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i);
    positions.setZ(i, -22 * Math.exp(-(x * x + y * y) / 1000));
  }
  fabric.position.set(0, 30, -8);
  const matter = d.material('#d4b991', .8), starlight = d.material('#9dbedc', .8);
  for (let i = 0; i < 18; i++) {
    const position = (time: number): Point => {
      const p = (noise(i) + time * .38) % 1, a = i * 2.399 + p * 6.5;
      const radius = 12 + (1 - p) ** 1.8 * 66;
      return [Math.cos(a) * radius, 30 + Math.sin(a) * radius * .45, Math.sin(a) * radius * .32];
    };
    const fragment = d.mesh(new THREE.IcosahedronGeometry(.65 + noise(i + 3), 0), i % 3 ? matter : starlight);
    fragment.name = 'gravity-captured-asteroid';
    const tail = d.stroke((u, t) => position(Math.max(0, t - u * .12)), .18, starlight);
    tail.name = 'spaghettified-starlight';
    d.motions.push(t => {
      fragment.position.set(...position(t)); fragment.rotation.set(t + i, t * 2, i);
      const p = (noise(i) + t * .38) % 1;
      fragment.scale.set(.6, .6, 1 + p * 2); fragment.visible = tail.visible = p < .91;
    });
  }
  d.motions.push(t => { hole.scale.setScalar(ease(t / .38)); fabric.scale.setScalar(.85 + ease(t / .6) * .15); });
  return d.finish();
}

export const PORTAL_DISTANCE = 190;
/** Two deep star tunnels share a destination, never a beam or a flat rune circle. */
export function buildCosmicRay(spell: ElementalSpell, heading: number, distance = PORTAL_DISTANCE) {
  const d = new SpellDrawing(spell, heading);
  d.root.userData.travelDistance = distance;
  for (let i = 0; i < 2; i++) {
    const gate = new THREE.Group(); gate.name = i ? 'wormhole-exit' : 'wormhole-entrance';
    gate.position.set(0, 32, i * distance); gate.rotation.y = -heading; d.root.add(gate);
    const throat = lens(d, 'wormhole', 34, gate); throat.scale.x = .64;
    const stars = d.material('#adc8ed', .65);
    for (let j = 0; j < 9; j++) {
      const trail = d.stroke((u, t) => {
        const a = j * TAU / 9 + (1 - u) * 3.4 + t * .25;
        const r = 4 + u * 23;
        return [Math.cos(a) * r * .64, Math.sin(a) * r, -20 * (1 - u) ** 2];
      }, .13, stars, gate);
      trail.name = 'wormhole-lensed-star-track';
    }
    d.motions.push(t => {
      const grow = ease((t - i * .10) / .28), close = 1 - ease((t - 1.35) / .35);
      gate.scale.set(grow * close, grow * close, grow * close);
    });
  }
  // Spatially curved corridor: sparse points stretch through the warp as the caster vanishes.
  d.particles(64, (i, t) => {
    const p = (noise(i) + Math.max(0, t - .4) * 1.2) % 1;
    const a = i * 2.399, r = 6 + Math.sin(p * Math.PI) * 10;
    return [Math.cos(a) * r, 32 + Math.sin(a) * r, p * distance];
  }, .45, d.material('#94a9ce', .65));
  const corridor = d.root.children[d.root.children.length - 1]; corridor.name = 'wormhole-stretched-star-corridor';
  d.motions.push(t => { corridor.visible = t > .4 && t < 1.1; });
  return d.finish();
}

/** Planetary defenders orbit behind a bowed coordinate fabric; each has its own planetary disc. */
export function buildPlanetaryRings(spell: ElementalSpell) {
  const d = new SpellDrawing(spell);
  const ward = createSpaceWard(33); ward.root.position.y = 32;
  d.root.add(ward.root); d.surfaces.push(ward.material);
  for (let i = 0; i < 4; i++) {
    const planet = lens(d, 'planet', 5.5); planet.name = 'orbital-guardian-planet';
    const plane = new THREE.Group(); plane.position.y = 32;
    plane.rotation.set(.45 + i * .32, i * .7, i * .4); d.root.add(plane);
    const ring = d.mesh(new THREE.RingGeometry(8, 11, 64), d.material('#b9a48d', .5), planet);
    ring.rotation.x = 1.12; ring.rotation.y = .3;
    const path = (u: number, t: number): Point => {
      const a = u * TAU + t * (.45 + i * .12) + i * TAU / 4;
      return [Math.cos(a) * 37, 0, Math.sin(a) * 37];
    };
    const orbit = d.stroke(path, .12, d.material('#89a6c5', .45), plane, 72);
    orbit.name = 'keplerian-orbit';
    plane.add(planet);
    d.motions.push(t => { planet.position.set(...path(0, t)); planet.rotation.y = -plane.rotation.y; });
  }
  d.motions.push(t => { ward.update(t); ward.root.scale.setScalar(ease(t / .35)); });
  return d.finish();
}
