import * as THREE from 'three';

export type ElectricPoint = [number, number, number];
type Endpoint = ElectricPoint | ((time: number) => ElectricPoint);
const random = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

/** Connected angular leaders with a white hot core and a soft blue/gold corona.
 * Buffers are allocated once; forks can attach to the exact live points on their parent arc. */
export function createElectricArc(from: Endpoint, to: Endpoint, width: number, seed: number,
  jitter = 8, segments = 18, gold = false) {
  const root = new THREE.Group(); root.name = 'branching-electric-discharge';
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uStrength: { value: 1 },
      uSeed: { value: seed }, uGold: { value: gold ? 1 : 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv;uniform float uTime,uOpacity,uStrength,uSeed,uGold;
      void main(){float across=abs(vUv.y-.5)*2.;
        float core=exp(-across*across*60.),corona=exp(-across*across*7.5);
        float restrike=.62+.38*step(.38,fract(sin(floor(uTime*22.)+uSeed)*43758.5));
        float leader=.78+.22*sin(vUv.x*63.-uTime*38.+uSeed);
        vec3 tint=mix(vec3(.16,.48,1.),vec3(1.,.65,.07),uGold);
        vec3 color=tint*corona*.9+vec3(.88,.96,1.)*core*1.5;
        float alpha=(core+corona*.44)*restrike*leader*uOpacity*uStrength;
        alpha*=smoothstep(0.,.025,vUv.x)*(1.-smoothstep(.975,1.,vUv.x));
        if(alpha<.006)discard;gl_FragColor=vec4(color,alpha);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    blending: THREE.AdditiveBlending,
  });
  material.userData.element = 'lightning'; material.userData.opacity = 1;
  const positions = new Float32Array((segments + 1) * 12), uv = new Float32Array((segments + 1) * 8);
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    uv.set([i / segments, 0, i / segments, 1, i / segments, 0, i / segments, 1], i * 8);
    if (i < segments) for (let plane = 0; plane < 2; plane++) {
      const a = i * 4 + plane * 2; indices.push(a, a + 1, a + 4, a + 1, a + 5, a + 4);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; mesh.renderOrder = 5; root.add(mesh);
  const normal = new THREE.Vector3(), binormal = new THREE.Vector3(), tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3(1, 0, 0);
  // Reuse sampled junctions across both geometry planes and every connected fork.
  const sampled: (ElectricPoint | undefined)[] = Array(segments + 1);
  let sampledTime = Number.NaN;
  const node = (i: number, time: number): ElectricPoint => {
    if (sampledTime !== time) { sampled.fill(undefined); sampledTime = time; }
    const cached = sampled[i]; if (cached) return cached;
    const a = typeof from === 'function' ? from(time) : from, b = typeof to === 'function' ? to(time) : to;
    const u = i / segments, frame = Math.floor(time * 18), taper = Math.sin(u * Math.PI);
    tangent.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    if (tangent.lengthSq() < .01) tangent.set(0, 1, 0);
    normal.crossVectors(tangent, Math.abs(tangent.y) > .95 ? right : up).normalize(); binormal.crossVectors(tangent, normal);
    const x = (random(i * 3 + seed + frame * 13) - .5) * jitter * taper;
    const y = (random(i * 7 + seed + frame * 11) - .5) * jitter * taper;
    const result: ElectricPoint = [a[0] + (b[0] - a[0]) * u + normal.x * x + binormal.x * y,
      a[1] + (b[1] - a[1]) * u + normal.y * x + binormal.y * y,
      a[2] + (b[2] - a[2]) * u + normal.z * x + binormal.z * y];
    sampled[i] = result; return result;
  };
  const pointAt = (u: number, time: number): ElectricPoint => {
    const f = THREE.MathUtils.clamp(u, 0, 1) * segments, i = Math.min(segments - 1, Math.floor(f));
    const a = node(i, time), b = node(i + 1, time);
    return a.map((v, axis) => v + (b[axis] - v) * (f - i)) as ElectricPoint;
  };
  const update = (time: number) => {
    material.uniforms.uTime.value = time;
    for (let i = 0; i <= segments; i++) {
      const p = node(i, time), next = node(Math.min(segments, i + 1), time), prev = node(Math.max(0, i - 1), time);
      tangent.set(next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]).normalize();
      if (tangent.lengthSq() < .01) tangent.set(0, 1, 0);
      normal.crossVectors(tangent, Math.abs(tangent.y) > .95 ? right : up).normalize(); binormal.crossVectors(tangent, normal);
      const radius = width * (.45 + .55 * Math.sin(i / segments * Math.PI));
      for (let j = 0; j < 4; j++) {
        const direction = j < 2 ? normal : binormal, sign = j % 2 ? 1 : -1, k = i * 12 + j * 3;
        positions[k] = p[0] + direction.x * sign * radius;
        positions[k + 1] = p[1] + direction.y * sign * radius;
        positions[k + 2] = p[2] + direction.z * sign * radius;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  };
  update(0); return { root, material, update, pointAt };
}

/** Volt's corona consists of live discharges, with no solid antlers or cone spikes. */
export function createElectricCrown() {
  const root = new THREE.Group();
  const arcs = Array.from({ length: 5 }, (_, i) => {
    const a = i / 5 * Math.PI * 2;
    const arc = createElectricArc([Math.cos(a) * .1, .12, Math.sin(a) * .1],
      [Math.cos(a) * .24, .28 + (i % 2) * .1, Math.sin(a) * .24], .028, i * 31, .075, 9, i % 2 === 0);
    root.add(arc.root); return arc;
  });
  const forks = arcs.map((arc, i) => {
    const fork = createElectricArc(t => arc.pointAt(.55, t), t => {
      const p = arc.pointAt(.55, t); return [p[0] + (i % 2 ? -.07 : .07), p[1] + .065, p[2] + .045];
    }, .016, i * 19 + 200, .025, 6);
    root.add(fork.root); return fork;
  });
  const discharges = [...arcs, ...forks];
  const update = (time: number) => {
    for (const arc of discharges) { arc.update(time); arc.material.uniforms.uStrength.value = .55 + .45 * random(Math.floor(time * 15) + arc.material.uniforms.uSeed.value); }
  };
  return { root, update };
}
