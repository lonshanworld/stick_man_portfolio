import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { SpellDrawing, clamp, ease, noise, TAU, type Point, type BuiltSpellEffect } from './spellDrawing';

type VoidSurface = 'obelisk' | 'cut' | 'breach';

/** Void has opaque negative space bounded by hot, fractured energy, not a red wireframe. */
function voidSurface(d: SpellDrawing, kind: VoidSurface, width: number, height: number) {
  const patterns: Record<VoidSurface, string> = {
    obelisk: `
      float bevel = .42 - max(0.0, p.y - .52) * .48;
      float edge = abs(p.x) - bevel;
      float core = (1.0 - smoothstep(-.012, .012, edge)) * (1.0 - smoothstep(.91, .96, abs(p.y)));
      float rim = exp(-abs(edge) * 100.0) * (1.0 - smoothstep(.88, .97, abs(p.y)));
      float fault = abs(p.x - sin(p.y * 19.0) * .045 - .07);
      float crack = exp(-fault * 170.0) * core;
      float strata = fbm(vec2(p.x * 23.0, p.y * 13.0));
      color = vec3(.008,.003,.018) + vec3(.045,.014,.065) * strata;
      color += vec3(.7,.22,.72) * crack * (.65 + .35 * sin(uTime * 5.0 + p.y * 8.0));
      color += vec3(.8,.5,1.0) * rim;
      alpha = max(core, rim * .85);`,
    cut: `
      float taper = pow(max(0.0, 1.0 - p.x * p.x), .65);
      float jagged = (fbm(vec2(p.x * 25.0, floor(uTime * 9.0) * .13)) - .5) * .095;
      float distance = abs(p.y - jagged);
      float edge = taper * (.2 + .07 * uOpen);
      float core = 1.0 - smoothstep(edge - .008, edge, distance);
      float rim = exp(-abs(distance - edge) * 85.0) * taper;
      float glow = exp(-abs(distance - edge) * 14.0) * taper;
      float veins = pow(.5 + .5 * sin(p.x * 49.0 - uTime * 7.0), 12.0);
      color = vec3(.58,.055,.36) * glow + vec3(.9,.56,1.0) * rim * (1.0 + veins);
      color = mix(color, vec3(.014,.004,.026) + vec3(.08,.015,.12) * fbm(p*18.0), core);
      alpha = max(core, min(1.0, rim + glow * .55)) * (1.0-smoothstep(.86,1.0,abs(p.x)));`,
    breach: `
      float tip = pow(max(0.0, 1.0 - abs(p.y)), .7);
      float jagged = .72 + .08 * sin(p.y * 23.0) + .045 * sin(p.y * 61.0);
      float edge = tip * jagged * uOpen * .72;
      float distance = abs(p.x + sin(p.y * 9.0) * .035);
      float core = (1.0 - smoothstep(edge - .008, edge, distance)) * step(.018, uOpen);
      float rim = exp(-abs(distance - edge) * 95.0) * tip;
      float glow = exp(-abs(distance - edge) * 15.0) * tip;
      float abyss = fbm(vec2(p.x * 9.0, p.y * 13.0 - uTime * .8));
      float scars = pow(.5 + .5 * sin(p.y * 42.0 + abyss * 10.0 - uTime * 2.0), 14.0);
      color = vec3(.66,.06,.31) * glow + vec3(.94,.63,1.0) * rim * 1.8;
      color = mix(color, vec3(.008,.003,.018) + vec3(.12,.015,.2) * abyss * scars, core);
      alpha = max(core, min(1.0, rim + glow * .55));`,
  };
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uOpen: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `varying vec2 vUv; uniform float uTime,uOpacity,uOpen;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){return n2(p)*.57+n2(p*2.1)*.28+n2(p*4.3)*.15;}
      void main(){vec2 p=vUv*2.0-1.0;vec3 color=vec3(0.0);float alpha=0.0;
        ${patterns[kind]}
        if(alpha<.004)discard;
        gl_FragColor=vec4(color,alpha*uOpacity);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  material.userData.opacity = 1; material.userData.element = 'void';
  d.surfaces.push(material);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.name = `void-${kind}-surface`; mesh.renderOrder = 5;
  d.root.add(mesh);
  return mesh;
}

function fragments(d: SpellDrawing, count: number, path: (i: number, t: number) => Point, size = 2) {
  const material = d.material('#4b244f');
  const geometry = new THREE.OctahedronGeometry(1);
  const shards = new THREE.InstancedMesh(geometry, material, count);
  shards.name = 'obsidian-fragments'; shards.frustumCulled = false;
  shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage); d.root.add(shards);
  const dummy = new THREE.Object3D();
  d.motions.push(t => {
    for (let i = 0; i < count; i++) {
      dummy.position.set(...path(i, t)); dummy.rotation.set(i + t, t * 2 + i, i * 2.4);
      dummy.scale.set(size * (.55 + noise(i) * .65), size * (1 + noise(i + 1)), size * .35);
      dummy.updateMatrix(); shards.setMatrixAt(i, dummy.matrix);
    }
    shards.instanceMatrix.needsUpdate = true;
  });
  return shards;
}

/** A silence monument assembles vertically; no orbit, accretion, or inward pull. */
export function buildVoidObelisk(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  d.root.userData.voidDesign = 'silence-obelisk';
  const monument = new THREE.Group(); monument.name = 'null-obelisk'; d.root.add(monument);
  // Crossed opaque faces retain the tall silhouette when viewed from either side.
  for (const angle of [0, Math.PI / 2]) {
    const face = voidSurface(d, 'obelisk', 52, 102);
    d.root.remove(face); monument.add(face);
    face.position.y = 47; face.rotation.y = angle;
  }
  const rise = (t: number) => ease(t / .55);
  const release = (t: number) => ease((t - spell.duration * .78) / (spell.duration * .22));
  // Interrupted angular glyphs close into a seal when the silence takes effect.
  for (let i = 0; i < 5; i++) {
    const y = 19 + i * 13;
    const glyph = d.line([[-8, y + 3, 14], [-4, y + 6, 14], [5, y, 14], [1, y - 4, 14]], .7, d.secondary, monument);
    glyph.name = 'broken-silence-glyph';
    d.motions.push(t => {
      glyph.visible = t > .35 + i * .055;
      glyph.position.x = Math.sin(t * 3 + i) * release(t) * 12;
    });
  }
  // Separated stone splinters rise alongside the monolith, then scatter outward.
  const shards = fragments(d, 22, (i, t) => {
    const side = i % 2 ? -1 : 1, dissolve = release(t);
    return [side * (18 + noise(i) * 14 + dissolve * 22),
      (8 + noise(i + 4) * 73) * rise(t) + Math.sin(t * 2 + i) * 2 + dissolve * 12,
      (noise(i + 9) - .5) * 24];
  }, 2.5);
  shards.name = 'obelisk-splinters';
  // Four straight ground cracks communicate the area seal without a gravity ring.
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 4 + i * Math.PI / 2;
    d.stroke((u, t) => {
      const reach = u * 46 * rise(t);
      return [Math.cos(angle) * reach, 1 + Math.sin(u * 17 + i) * .6, Math.sin(angle) * reach];
    }, .45, d.primary);
  }
  d.motions.push(t => {
    monument.scale.set(1 + release(t) * .2, rise(t) * (1 - release(t)), 1);
    monument.position.y = -7 * (1 - rise(t));
  });
  return d.finish();
}

export function buildVoidScissors(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  d.root.userData.voidDesign = 'shearing-fractures';
  for (let i = 0; i < 2; i++) {
    const delay = .1 + i * .17;
    const cut = voidSurface(d, 'cut', 100, 24); cut.position.set(0, 36, 2 + i); cut.rotation.z = i ? -.63 : .63;
    d.motions.push(t => {
      const arrival = ease((t - delay) / .16), release = 1 - ease((t - 1.08) / .52);
      cut.scale.set(arrival, arrival * release, 1);
      cut.material.uniforms.uOpen.value = 1 + Math.sin(clamp((t - .42) / .6) * Math.PI) * .8;
    });
    for (const side of [-1, 1]) {
      const trail = d.ribbon((u, t) => {
        const x = (u - .5) * 88, y = side * Math.sin(u * Math.PI) * (8 + ease((t - .5) / .3) * 9);
        const a = i ? -.63 : .63;
        return [x * Math.cos(a) - y * Math.sin(a), 36 + x * Math.sin(a) + y * Math.cos(a), -2];
      }, 1.8, d.root, '#b179d8', .42);
      d.motions.push(t => { trail.visible = t > delay + .14 && t < 1.3; });
    }
  }
  const flash = d.star([0, 36, 5], 10, d.material('#ead0ff', .9));
  d.halo([0, 0, 0], 23, '#c45b9b', flash, .45);
  d.motions.push(t => { const p = clamp((t - .48) / .45); flash.visible = t > .48 && t < .93; flash.scale.setScalar(Math.sin(p * Math.PI) * 1.3); flash.rotation.z = .3; });
  const shards = fragments(d, 32, (i, t) => {
    const p = clamp((t - .53) / .75), a = i * 2.399, r = 8 + p * (20 + noise(i) * 22);
    return [Math.cos(a) * r, 36 + Math.sin(a) * r - p * p * 12, 4 + noise(i) * 8];
  }, 2);
  d.motions.push(t => { shards.visible = t > .53; });
  return d.finish();
}

export function buildVoidBreach(spell: ElementalSpell): BuiltSpellEffect {
  const d = new SpellDrawing(spell);
  d.root.userData.voidDesign = 'sutured-breach';
  const openness = (t: number) => ease(t / .38) * (1 - ease((t - spell.duration * .5) / (spell.duration * .35)));
  const breach = voidSurface(d, 'breach', 64, 96); breach.position.y = 43;
  d.halo([0, 43, -3], 44, '#6e2895', d.root, .24);
  // Broken obsidian panels frame the dimensional wound instead of a smooth portal ring.
  fragments(d, 18, (i, t) => {
    const p = openness(t), y = (i / 17 - .5) * 84, side = i % 2 ? -1 : 1;
    return [side * (7 + Math.sin(i / 17 * Math.PI) * 24) * p, 43 + y, -3 + Math.sin(t + i) * 3];
  }, 3);
  for (let i = 0; i < 9; i++) {
    const y = 10 + i * 8, width = Math.sin((i + 1) / 10 * Math.PI) * 25;
    const thread = d.stroke((u, t) => [(u - .5) * width * 2 * openness(t), y + Math.sin(u * Math.PI) * 3, 4], .35, d.material('#de8cce', .8));
    d.ribbon((u, t) => [(u - .5) * width * 2 * openness(t), y + Math.sin(u * Math.PI) * 3, 3], 1.15, thread, '#bf548e', .48);
    d.motions.push(t => { thread.visible = t > spell.duration * .48 + i * .065; });
  }
  for (let i = 0; i < 8; i++) d.ribbon((u, t) => {
    const a = i * TAU / 8, r = (12 + u * 42) * openness(t);
    return [Math.cos(a) * r, 43 + Math.sin(a) * r * .75, -6];
  }, 1.8, d.root, '#ad426e', .4);
  d.particles(42, (i, t) => {
    const p = (noise(i) + t * .5) % 1, r = (1 - p) * 48 * openness(t), a = i * 2.399;
    return [Math.cos(a) * r, 43 + Math.sin(a) * r, 6];
  }, .85, d.material('#ddb2eb', .7));
  d.motions.push(t => { breach.material.uniforms.uOpen.value = openness(t); breach.visible = t < spell.duration * .91; });
  return d.finish();
}
