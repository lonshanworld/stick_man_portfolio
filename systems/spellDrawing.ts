import * as THREE from 'three';
import type { ElementalSpell } from '../data/elementalSpells';
import { createSpellSurface } from './spellMaterials';
import { addElementalSpellArt } from './elementalSpellArt';

export interface BuiltSpellEffect {
  root: THREE.Object3D;
  update: (deltaSec: number, elapsed: number, duration: number) => void;
}

export type Point = [number, number, number];
type Motion = (time: number, progress: number) => void;
export const TAU = Math.PI * 2;
export const clamp = (n: number) => THREE.MathUtils.clamp(n, 0, 1);
export const ease = (n: number) => { const p = clamp(n); return p * p * (3 - 2 * p); };
export const noise = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const polar = (angle: number, radius: number, y = 0): Point => [Math.cos(angle) * radius, y, Math.sin(angle) * radius];

/** Small colored silhouettes, luminous inner strokes, and tapered moving trails.
 * Geometry is allocated only at cast time; animation reuses its buffers.
 * Normal blending preserves elemental color instead of washing everything white.
 */
export class SpellDrawing {
  root = new THREE.Group();
  motions: Motion[] = [];
  materials: (THREE.MeshBasicMaterial | THREE.SpriteMaterial)[] = [];
  glowTexture?: THREE.DataTexture;
  surfaces: THREE.ShaderMaterial[] = [];
  primary: THREE.MeshBasicMaterial;
  secondary: THREE.MeshBasicMaterial;
  white: THREE.MeshBasicMaterial;

  constructor(public spell: ElementalSpell, heading = 0) {
    this.root.rotation.y = heading;
    this.primary = this.material(spell.primaryColor || '#7edfff');
    this.secondary = this.material(spell.secondaryColor || '#ffffff');
    this.white = this.material('#fff8e7');
  }

  material(color: string, opacity = 1, glow = false) {
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending });
    m.userData.opacity = opacity;
    this.materials.push(m);
    return m;
  }

  /** Broad, soft-edged energy sheets supply volume around precise geometry. */
  ribbon(path: (u: number, t: number) => Point, width: number,
    parent: THREE.Object3D = this.root, color = this.spell.primaryColor || '#7edfff', opacity = .65,
    segments = 48) {
    const material = createSpellSurface(this.spell.element, color, this.spell.secondaryColor || '#fff8e7', opacity);
    this.surfaces.push(material);
    const positions = new Float32Array((segments + 1) * 6);
    const uv = new Float32Array((segments + 1) * 4);
    const indices: number[] = [];
    for (let i = 0; i <= segments; i++) {
      uv.set([i / segments, 0, i / segments, 1], i * 4);
      if (i < segments) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    const ribbon = new THREE.Mesh(geometry, material);
    ribbon.frustumCulled = false;
    parent.add(ribbon);
    const draw = (t: number) => {
      for (let i = 0; i <= segments; i++) {
        const u = i / segments, p = path(u, t), next = path(Math.min(1, u + .003), t);
        const prev = i === segments ? path(Math.max(0, u - .003), t) : p;
        let nx = -(next[1] - prev[1]), ny = next[0] - prev[0], nz = 0;
        let length = Math.hypot(nx, ny);
        if (length < .0001) { nx = 1; ny = 0; nz = 0; length = 1; }
        const radius = width * (.12 + .88 * Math.sin(u * Math.PI));
        for (let side = 0; side < 2; side++) {
          const sign = side ? 1 : -1, k = (i * 2 + side) * 3;
          positions[k] = p[0] + sign * nx / length * radius;
          positions[k + 1] = p[1] + sign * ny / length * radius;
          positions[k + 2] = p[2] + sign * nz * radius;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    };
    draw(0);
    this.motions.push(draw);
    return ribbon;
  }

  surface(geometry: THREE.BufferGeometry, color = this.spell.primaryColor || '#7edfff', opacity = .65,
    parent: THREE.Object3D = this.root) {
    const material = createSpellSurface(this.spell.element, color, this.spell.secondaryColor || '#fff8e7', opacity);
    this.surfaces.push(material);
    const mesh = new THREE.Mesh(geometry, material); parent.add(mesh); return mesh;
  }

  mesh(geometry: THREE.BufferGeometry, material = this.primary, parent: THREE.Object3D = this.root) {
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    return mesh;
  }

  halo(position: Point, radius: number, color: string, parent: THREE.Object3D = this.root, opacity = 0.35) {
    if (!this.glowTexture) {
      const pixels = new Uint8Array(32 * 32 * 4);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const r = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5);
        const index = (y * 32 + x) * 4;
        pixels[index] = pixels[index + 1] = pixels[index + 2] = 255;
        pixels[index + 3] = Math.round(Math.pow(Math.max(0, 1 - r), 2.5) * 255);
      }
      this.glowTexture = new THREE.DataTexture(pixels, 32, 32);
      this.glowTexture.magFilter = THREE.LinearFilter;
      this.glowTexture.needsUpdate = true;
    }
    const material = new THREE.SpriteMaterial({ map: this.glowTexture, color, transparent: true,
      opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    material.userData.opacity = opacity;
    this.materials.push(material);
    const sprite = new THREE.Sprite(material);
    sprite.position.set(...position); sprite.scale.set(radius * 2, radius * 2, 1);
    parent.add(sprite);
    return sprite;
  }

  // A four-sided tapered filament remains visible from any casting direction.
  stroke(path: (u: number, t: number) => Point, width = 0.55, material = this.primary,
    parent: THREE.Object3D = this.root, segments = 36, animated = true) {
    const positions = new Float32Array((segments + 1) * 4 * 3);
    const indices: number[] = [];
    for (let i = 0; i < segments; i++) for (let j = 0; j < 4; j++) {
      const a = i * 4 + j, b = i * 4 + (j + 1) % 4;
      indices.push(a, b, a + 4, b, b + 4, a + 4);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setIndex(indices);
    const mesh = this.mesh(geometry, material, parent);
    // Glow follows the exact path and inherits all visibility/transform changes.
    if (material === this.primary || material === this.secondary) {
      this.ribbon(path, width * (this.spell.element === 'lightning' ? 4 : 2.8), mesh,
        `#${material.color.getHexString()}`, this.spell.element === 'wind' ? .27 : .42, segments);
    }
    mesh.renderOrder = material === this.white ? 4 : material === this.secondary ? 3 : 2;
    mesh.frustumCulled = false;
    const tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3(1, 0, 0);
    const draw = (t: number) => {
      for (let i = 0; i <= segments; i++) {
        const u = i / segments, p = path(u, t), q = path(Math.min(1, u + 0.002), t);
        const prev = i === segments ? path(u - 0.002, t) : p;
        tangent.set(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]).normalize();
        if (tangent.lengthSq() < 0.01) tangent.set(0, 1, 0);
        normal.crossVectors(tangent, Math.abs(tangent.y) > 0.95 ? right : up).normalize();
        binormal.crossVectors(tangent, normal);
        const r = width * Math.pow(Math.sin(Math.PI * u), 0.65) + 0.015;
        for (let j = 0; j < 4; j++) {
          const a = j * Math.PI / 2, k = (i * 4 + j) * 3;
          positions[k] = p[0] + r * (normal.x * Math.cos(a) + binormal.x * Math.sin(a));
          positions[k + 1] = p[1] + r * (normal.y * Math.cos(a) + binormal.y * Math.sin(a));
          positions[k + 2] = p[2] + r * (normal.z * Math.cos(a) + binormal.z * Math.sin(a));
        }
      }
      geometry.attributes.position.needsUpdate = true;
    };
    draw(0);
    if (animated) this.motions.push(draw);
    return mesh;
  }

  line(points: Point[], width = 0.45, material = this.secondary, parent: THREE.Object3D = this.root) {
    return this.stroke((u) => {
      const f = u * (points.length - 1), i = Math.min(points.length - 2, Math.floor(f));
      return points[i].map((v, axis) => THREE.MathUtils.lerp(v, points[i + 1][axis], f - i)) as Point;
    }, width, material, parent, Math.max(12, points.length * 4), false);
  }

  mote(position: Point, radius = 1, material = this.secondary, parent: THREE.Object3D = this.root) {
    const m = this.mesh(new THREE.IcosahedronGeometry(radius, 1), material, parent);
    m.position.set(...position);
    return m;
  }

  leaf(size = 3, material = this.secondary, parent: THREE.Object3D = this.root) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(size, size * 0.6, size * 0.7, size * 1.5, 0, size * 2.4);
    s.bezierCurveTo(-size * 0.7, size * 1.5, -size, size * 0.6, 0, 0);
    return this.mesh(new THREE.ShapeGeometry(s, 7), material, parent);
  }

  petal(size: number, material = this.primary, parent: THREE.Object3D = this.root) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(size * 1.2, size * 0.8, size, size * 2.4, size * 0.35, size * 2.2);
    s.lineTo(0, size * 1.9);
    s.lineTo(-size * 0.35, size * 2.2);
    s.bezierCurveTo(-size, size * 2.4, -size * 1.2, size * 0.8, 0, 0);
    return this.mesh(new THREE.ShapeGeometry(s, 8), material, parent);
  }

  star(position: Point, size = 3, material = this.white, parent: THREE.Object3D = this.root) {
    const s = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, r = i % 2 ? size * 0.18 : size;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
    const m = this.mesh(new THREE.ShapeGeometry(s), material, parent);
    m.position.set(...position);
    return m;
  }

  particles(count: number, path: (i: number, t: number) => Point, size = 0.7, material = this.secondary) {
    const particles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), material, count);
    particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    particles.frustumCulled = false;
    this.root.add(particles);
    const dummy = new THREE.Object3D();
    this.motions.push(t => {
      for (let i = 0; i < count; i++) {
        dummy.position.set(...path(i, t));
        dummy.scale.setScalar(size * (0.35 + noise(i) * 0.65) * (0.7 + 0.3 * Math.sin(t * 9 + i)));
        dummy.updateMatrix();
        particles.setMatrixAt(i, dummy.matrix);
      }
      particles.instanceMatrix.needsUpdate = true;
    });
  }

  sparks(count = 36, radius = 35, height = 60) {
    this.particles(count, (i, t) => {
      const y = (t * (15 + noise(i) * 20) + noise(i + 80) * height) % height;
      return polar(i * 2.399 + t * 0.3, radius * Math.sqrt(noise(i + 10)), y);
    });
  }

  burst(at: number, center: Point, radius = 40, count = 24, material = this.secondary) {
    const fadingMaterial = this.material(`#${material.color.getHexString()}`, 0.9);
    this.particles(count, (i, t) => {
      const p = clamp((t - at) / 0.7), a = i * 2.399;
      const r = radius * (1 - Math.pow(1 - p, 2));
      return [center[0] + Math.cos(a) * r, center[1] + Math.sin(i * 4.7) * r * .55 + 22 * p - 36 * p * p, center[2] + Math.sin(a) * r];
    }, 1.1, fadingMaterial);
    const cloud = this.root.children[this.root.children.length - 1];
    this.motions.push(t => {
      cloud.visible = t > at && t < at + 0.7;
      fadingMaterial.opacity *= 1 - ease((t - at) / 0.7);
    });
  }

  finish(): BuiltSpellEffect {
    addElementalSpellArt(this);
    const update = (_delta: number, time: number, duration: number) => {
      const p = clamp(time / duration);
      const fade = ease(time / 0.12) * (1 - ease((p - 0.76) / 0.24));
      for (const m of this.materials) m.opacity = m.userData.opacity * fade;
      for (const m of this.surfaces) {
        m.uniforms.uTime.value = time;
        m.uniforms.uOpacity.value = m.userData.opacity * fade;
      }
      for (const motion of this.motions) motion(time, p);
    };
    update(0, 0, this.spell.duration);
    return { root: this.root, update };
  }
}

