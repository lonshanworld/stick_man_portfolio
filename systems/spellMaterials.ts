import * as THREE from 'three';
import type { ElementType } from '../types';

/** Each school owns its surface language; these are animated materials, not recolored decals. */
const SURFACES: Record<ElementType, string> = {
  fire: `float f = fbm(vec2(vUv.x * 7.0, vUv.y * 3.0 - uTime * 3.8));
    float tongues = smoothstep(.28, .74, f + sin(vUv.x * 24.0 + uTime * 5.0) * .12);
    energy = tongues; heat = pow(tongues, 3.0);`,
  water: `float ripples = sin(vUv.x * 38.0 + sin(vUv.y * 18.0 - uTime * 2.0) * 3.0 - uTime * 5.0);
    float caustics = pow(abs(sin(vUv.x * 23.0 + uTime) * cos(vUv.y * 31.0 - uTime * 1.6)), 9.0);
    energy = .3 + .3 * ripples + caustics; heat = caustics;`,
  lightning: `float split = abs(vUv.y - .5 + (hash(floor(vUv.x * 24.0) + floor(uTime * 22.0)) - .5) * .36);
    energy = exp(-split * 26.0) + .12; heat = exp(-split * 65.0);`,
  ice: `vec2 cell = floor(vUv * vec2(11.0, 7.0));
    float facet = hash(cell.x + cell.y * 31.0);
    float vein = pow(1.0 - abs(sin((vUv.x + vUv.y) * 47.0)), 18.0);
    energy = .18 + facet * .52 + vein * .5; heat = vein + pow(facet, 8.0) * .4;`,
  wind: `float bands = pow(.5 + .5 * sin(vUv.y * 30.0 + vUv.x * 12.0 - uTime * 8.0), 5.0);
    energy = .08 + bands * .65; heat = bands * .25;`,
  soil: `float rock = fbm(vUv * 18.0);
    float fracture = pow(1.0 - abs(sin(vUv.x * 31.0 + rock * 8.0)), 24.0);
    energy = .2 + rock * .45 + fracture; heat = fracture * (.7 + .3 * sin(uTime * 3.0));`,
  trees: `float grain = pow(.5 + .5 * sin(vUv.y * 68.0 + fbm(vUv * 5.0) * 15.0), 7.0);
    float sap = pow(.5 + .5 * sin(vUv.x * 14.0 - uTime * 2.0), 10.0);
    energy = .25 + grain * .35 + sap * .3; heat = sap * grain;`,
  dark: `float smoke = fbm(vUv * 5.0 + vec2(uTime * .3, -uTime * .7));
    energy = smoothstep(.23, .7, smoke) * .85; heat = pow(smoke, 5.0);`,
  light: `float rays = pow(abs(sin(vUv.x * 37.0)), 12.0);
    energy = .38 + rays * .62; heat = rays * (.75 + .25 * sin(uTime * 2.0));`,
  space: `vec2 cells = floor(vUv * 65.0);
    float star = step(.984, hash(cells.x + cells.y * 89.0));
    float nebula = fbm(vUv * 6.0 + vec2(uTime * .09, 0.0));
    energy = .15 + nebula * .6 + star; heat = star + pow(nebula, 6.0);`,
  time: `float ticks = step(.72, fract(vUv.x * 36.0));
    float sweep = pow(.5 + .5 * cos(vUv.x * 6.283 + uTime * 2.0), 12.0);
    energy = .18 + ticks * .65 + sweep * .3; heat = sweep;`,
  robot: `vec2 grid = abs(fract(vUv * vec2(24.0, 8.0)) - .5);
    float trace = step(.43, max(grid.x, grid.y));
    float scan = pow(.5 + .5 * sin(vUv.x * 17.0 - uTime * 7.0), 18.0);
    energy = .12 + trace * .62 + scan; heat = trace * scan;`,
  healing: `float phase = fract(vUv.x * 3.0 - uTime * 1.15);
    float beat = exp(-pow((phase - .16) / .07, 2.0)) + .55 * exp(-pow((phase - .34) / .09, 2.0));
    float suture = smoothstep(.78, .9, cos(vUv.x * 90.0)) * exp(-abs(vUv.y - .5) * 8.0);
    energy = .18 + beat * .5 + suture * .3; heat = beat * .45;`,
  void: `float tear = step(.55, fbm(vec2(vUv.x * 18.0, vUv.y * 8.0 + floor(uTime * 8.0) * .1)));
    float seam = exp(-abs(vUv.y - .5) * 28.0);
    energy = tear * .5 + seam; heat = seam * tear;`,
};

export function createSpellSurface(element: ElementType, color: string, accent: string, opacity = .7) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uOpacity: { value: opacity },
      uColor: { value: new THREE.Color(color) }, uAccent: { value: new THREE.Color(accent) },
    },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv;
      uniform float uTime, uOpacity; uniform vec3 uColor, uAccent;
      float hash(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
      float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i.x+i.y*57.0), hash(i.x+1.0+i.y*57.0), f.x),
          mix(hash(i.x+(i.y+1.0)*57.0), hash(i.x+1.0+(i.y+1.0)*57.0), f.x), f.y); }
      float fbm(vec2 p) { return n2(p)*.57+n2(p*2.1)*.28+n2(p*4.3)*.15; }
      void main() {
        float energy = 0.0, heat = 0.0;
        ${SURFACES[element]}
        float edge = pow(max(0.0, sin(vUv.y * 3.141593)), .8);
        float ends = smoothstep(0.0, .045, vUv.x) * smoothstep(0.0, .045, 1.0-vUv.x);
        vec3 color = mix(uColor, uAccent, clamp(heat, 0.0, 1.0));
        gl_FragColor = vec4(color * (1.0 + heat * .55), clamp(energy, 0.0, 1.0) * edge * ends * uOpacity);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, toneMapped: false,
  });
  material.userData.opacity = opacity;
  material.userData.element = element;
  return material;
}
