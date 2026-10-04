import * as THREE from 'three';

type Point = [number, number, number];
const clamp = (n: number) => THREE.MathUtils.clamp(n, 0, 1);

/** Charcoal cloth with moving smoke and a restrained, cold rim. */
export function createShadowMaterial(opacity = .85, bone = false, softEdges = false) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: opacity }, uBone: { value: bone ? 1 : 0 }, uSoftEdges: { value: softEdges ? 1 : 0 } },
    vertexShader: `varying vec2 vUv;varying vec3 vN;varying vec3 vView;
      void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vView=-p.xyz;gl_Position=projectionMatrix*p;}`,
    fragmentShader: `varying vec2 vUv;varying vec3 vN;varying vec3 vView;uniform float uTime,uOpacity,uBone,uSoftEdges;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main(){float smoke=noise(vUv*4.+vec2(uTime*.12,-uTime*.25))*.75+noise(vUv*9.+uTime*.07)*.25;
        float rim=pow(1.-abs(dot(normalize(vN),normalize(vView))),2.);
        float light=.55+.45*max(0.,dot(normalize(vN),normalize(vec3(-.4,.8,1.))));
        vec3 shade=mix(vec3(.012,.018,.028),vec3(.07,.095,.11),smoke)*light+vec3(.075,.13,.13)*rim;
        vec3 bone=mix(vec3(.31,.34,.32),vec3(.64,.66,.57),smoke)*light;
        float edge=smoothstep(0.,.13,vUv.x)*(1.-smoothstep(.87,1.,vUv.x));
        gl_FragColor=vec4(mix(shade,bone,uBone),uOpacity*mix(1.,edge,uSoftEdges));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  material.userData.element = 'dark'; material.userData.opacity = opacity;
  return material;
}

/** A curved sheet with uneven, torn edges, animated in its existing vertex buffer. */
export function createShadowCloth(path: (u: number, time: number) => Point, width: (u: number) => number, material: THREE.ShaderMaterial, segments = 32) {
  const positions = new Float32Array((segments + 1) * 9), uv = new Float32Array((segments + 1) * 6), indices: number[] = [];
  for (let i = 0; i <= segments; i++) for (let j = 0; j < 3; j++) {
    uv.set([j / 2, i / segments], (i * 3 + j) * 2);
    if (i < segments && j < 2) { const a = i * 3 + j; indices.push(a, a + 1, a + 3, a + 1, a + 4, a + 3); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const root = new THREE.Mesh(geometry, material); root.name = 'dark-tattered-cloth'; root.frustumCulled = false;
  const update = (time: number) => {
    for (let i = 0; i <= segments; i++) {
      const u = i / segments, p = path(u, time), w = width(u);
      for (let j = 0; j < 3; j++) {
        const side = j - 1, k = (i * 3 + j) * 3;
        const torn = 1 - .2 * Math.sin(u * 39) ** 6;
        positions[k] = p[0] + side * w * torn;
        positions[k + 1] = p[1];
        positions[k + 2] = p[2] + Math.sin(u * Math.PI) * w * .23 * (1 - Math.abs(side));
      }
    }
    geometry.attributes.position.needsUpdate = true; geometry.computeVertexNormals();
  };
  update(0); return { root, update };
}

function boneSegment(length: number, radius: number, material: THREE.ShaderMaterial) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * .7, radius, length, 7), material);
  mesh.position.y = length / 2; return mesh;
}

/** Five articulated digits grow out of a broad palm; each digit has three phalanges. */
export function createSpectralHand(size: number, shadow: THREE.ShaderMaterial, bone: THREE.ShaderMaterial) {
  const root = new THREE.Group(); root.name = 'dark-skeletal-hand'; root.scale.setScalar(size);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), shadow); palm.name = 'dark-hand-palm'; palm.scale.set(.48, .6, .18); root.add(palm);
  const digits: THREE.Group[][] = [];
  for (let i = 0; i < 5; i++) {
    const finger: THREE.Group[] = [], lengths = i === 0 ? [.37, .3, .26] : [.55 + Math.sin(i * .85) * .13, .38, .28];
    let parent: THREE.Object3D = root;
    lengths.forEach((length, j) => {
      const joint = new THREE.Group(); joint.name = `dark-finger-${i}-joint-${j}`;
      if (!j) { joint.position.set(i === 0 ? -.47 : (i - 2.5) * .23, i === 0 ? -.06 : .48, .02); joint.rotation.z = i === 0 ? .92 : -(i - 2.5) * .09; }
      else joint.position.y = lengths[j - 1];
      joint.add(boneSegment(length, j === 2 ? .047 : .065, bone));
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(.075, 7, 5), bone); joint.add(knuckle);
      parent.add(joint); parent = joint; finger.push(joint);
    });
    digits.push(finger);
  }
  return { root, update: (grip: number) => digits.forEach((finger, i) => finger.forEach((joint, j) => { joint.rotation.x = clamp(grip) * (j ? 1.05 : .58) + (i === 0 ? .15 : 0); })) };
}

/** A recessed death mask is visible inside a hood, without an oversized glowing orb. */
export function createDeathMask(size: number, bone: THREE.ShaderMaterial) {
  const root = new THREE.Group(); root.name = 'dark-death-mask'; root.scale.setScalar(size);
  const face = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 12), bone); face.scale.set(.48, .58, .29); root.add(face);
  const black = new THREE.MeshBasicMaterial({ color: '#070C12', transparent: true }); black.userData.opacity = 1;
  for (const side of [-1, 1]) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), black); socket.position.set(side * .2, .09, .25); socket.scale.set(1, .8, .45); root.add(socket);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.09, .2, 3), black); nose.position.set(0, -.13, .29); nose.rotation.z = Math.PI; root.add(nose);
  for (let i = 0; i < 5; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(.075, .15, .12), bone); tooth.position.set((i - 2) * .085, -.49, .17); root.add(tooth);
  }
  root.userData.materials = [black]; return root;
}

export function createDarkCrest() {
  const root = new THREE.Group(); root.name = 'dark-reaper-crown';
  const shade = createShadowMaterial(.95), bone = createShadowMaterial(.9, true);
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(side * .11, .11, 0), new THREE.Vector3(side * .18, .23, -.025), new THREE.Vector3(side * .15, .34, -.045)]);
    const geometry = new THREE.TubeGeometry(curve, 16, .029, 6, false);
    const p = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
    for (let i = 0; i < p.count; i++) { const u = uv.getX(i), center = curve.getPointAt(u), taper = 1 - u * .96; p.setXYZ(i, center.x + (p.getX(i) - center.x) * taper, center.y + (p.getY(i) - center.y) * taper, center.z + (p.getZ(i) - center.z) * taper); }
    geometry.computeVertexNormals(); root.add(new THREE.Mesh(geometry, bone));
  }
  const wisps = [-1, 0, 1].map((side, i) => {
    const cloth = createShadowCloth((u, t) => [side * .085 + Math.sin(t * 1.1 + u * 4 + i) * u * .025, .15 + u * (.15 + i * .02), -.04 + u * .025], u => .03 * Math.sin(u * Math.PI), shade, 18);
    root.add(cloth.root); return cloth;
  });
  return { root, update: (t: number) => { shade.uniforms.uTime.value = bone.uniforms.uTime.value = t; wisps.forEach(wisp => wisp.update(t)); } };
}

/** Cambered bat membrane with scalloped trailing edges, built as a curved volume. */
export function createBatWing(side: number) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const segments = 24, rows = 4;
  for (let i = 0; i <= segments; i++) {
    const u = i / segments, top = Math.sin(u * Math.PI * .85) * 7 + u * 4;
    const chord = Math.sin(u * Math.PI) * (7 + Math.abs(Math.sin(u * Math.PI * 3)) * 5);
    for (let j = 0; j <= rows; j++) {
      const v = j / rows;
      positions.push(side * u * 23, top - v * chord, Math.sin(v * Math.PI) * Math.sin(u * Math.PI) * 3.2);
      uv.push(u, v);
      if (i < segments && j < rows) { const a = i * (rows + 1) + j; indices.push(a, a + 1, a + rows + 1, a + 1, a + rows + 2, a + rows + 1); }
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.computeVertexNormals(); return geometry;
}

export function createDarkMantle() {
  const root = new THREE.Group(); root.name = 'dark-shoulder-shroud';
  const shade = createShadowMaterial(.7, false, true);
  const strips = [-1, 1].map(side => {
    const cloth = createShadowCloth((u, t) => [side * (.085 + u * .035) + Math.sin(t * 1.5 + u * 4) * u * .015, .15 - u * .34, -.06 - Math.sin(u * Math.PI) * .03], u => .05 * (1 - u * .8), shade, 22);
    root.add(cloth.root); return cloth;
  });
  return { root, update: (t: number) => { shade.uniforms.uTime.value = t; strips.forEach(strip => strip.update(t)); } };
}

export function createDarkPalm(facingTarget: THREE.Object3D) {
  const shade = createShadowMaterial(0), bone = createShadowMaterial(0, true), hand = createSpectralHand(.095, shade, bone);
  const root = new THREE.Group(); root.name = 'hand-magic-seal-dark'; root.add(hand.root); root.visible = false;
  hand.root.position.y = -.05;
  root.userData.darkSeal = { facingTarget, materials: [shade, bone], hand, activation: 0 };
  return root;
}
